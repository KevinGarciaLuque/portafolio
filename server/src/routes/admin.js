import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import { pool, UPLOAD_DIR, PRIVATE_DIR } from '../db.js';
import { requireAdmin, signToken } from '../auth.js';
import { getCv, setSetting, removeCvFile } from '../cv.js';
import { looksLikePdf, cleanOriginalName } from '../cvName.js';

const r = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm']);
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_q, f, cb) => cb(null, crypto.randomBytes(12).toString('hex') + path.extname(f.originalname).toLowerCase()),
  }),
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_q, f, cb) => cb(null, ALLOWED.has(path.extname(f.originalname).toLowerCase())),
});

r.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  const [rows] = await pool.query('SELECT * FROM admins WHERE username=?', [username || '']);
  const a = rows[0];
  if (!a || !(await bcrypt.compare(password || '', a.password_hash)))
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  res.json({ token: signToken(a), username: a.username });
});

r.use(requireAdmin);

r.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo no permitido' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ---- Currículum (CV): subir PDF, activar/desactivar la descarga pública, ver y eliminar ----
const cvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });

r.get('/cv', async (_q, res) => {
  const cv = await getCv();
  const st = cv.exists ? fs.statSync(cv.full) : null;
  res.json({ hasFile: cv.exists, enabled: cv.enabled && cv.exists, name: cv.name, size: st?.size || 0, updated: st ? st.mtime.toISOString() : null });
});

// El admin puede ver el PDF aunque la descarga pública esté desactivada
r.get('/cv/file', async (_q, res) => {
  const cv = await getCv();
  if (!cv.exists) return res.status(404).json({ error: 'No hay CV cargado' });
  res.set('Cache-Control', 'no-store').type('application/pdf').sendFile(cv.full);
});

r.post('/cv', (req, res) => {
  cvUpload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'El PDF no puede pesar más de 10 MB' : 'Archivo no válido' });
    const f = req.file;
    if (!f) return res.status(400).json({ error: 'Selecciona un archivo PDF' });
    if (!looksLikePdf(f.buffer)) return res.status(400).json({ error: 'El archivo no es un PDF válido' });
    try {
      const before = await getCv();
      const file = `cv-${crypto.randomBytes(12).toString('hex')}.pdf`;
      fs.writeFileSync(path.join(PRIVATE_DIR, file), f.buffer);
      await setSetting('cv_file', file);
      await setSetting('cv_name', cleanOriginalName(f.originalname));
      if (!before.exists) await setSetting('cv_enabled', 'true'); // la primera vez queda activado; luego se respeta el interruptor
      if (before.file) removeCvFile(before.file);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'No se pudo guardar el CV' });
    }
  });
});

r.put('/cv', async (req, res) => {
  const enabled = req.body?.enabled === true;
  if (enabled && !(await getCv()).exists) return res.status(400).json({ error: 'Primero sube un CV en PDF' });
  await setSetting('cv_enabled', enabled ? 'true' : 'false');
  res.json({ ok: true, enabled });
});

r.delete('/cv', async (_q, res) => {
  const cv = await getCv();
  if (cv.file) removeCvFile(cv.file);
  await setSetting('cv_file', '');
  await setSetting('cv_name', '');
  await setSetting('cv_enabled', 'false');
  res.json({ ok: true });
});

r.get('/stats', async (_q, res) => {
  const [[s]] = await pool.query('SELECT COUNT(*) n FROM systems');
  const [[m]] = await pool.query('SELECT COUNT(*) n FROM messages WHERE is_read=0');
  const [[p]] = await pool.query("SELECT COUNT(*) n FROM meetings WHERE status='pending'");
  const [[u]] = await pool.query("SELECT COUNT(*) n FROM meetings WHERE status<>'cancelled' AND start_at>=NOW()");
  res.json({ systems: s.n, unread: m.n, pending: p.n, upcoming: u.n });
});

// Analítica propia: visitas por periodo, páginas más vistas, orígenes y serie de los últimos 14 días
r.get('/analytics', async (_q, res) => {
  const [[t]] = await pool.query(`SELECT
    COALESCE(SUM(CASE WHEN day = CURDATE() THEN views END), 0) today,
    COALESCE(SUM(CASE WHEN day >= CURDATE() - INTERVAL 6 DAY THEN views END), 0) week,
    COALESCE(SUM(views), 0) month
    FROM page_views WHERE day >= CURDATE() - INTERVAL 29 DAY`);
  const [pages] = await pool.query(
    'SELECT path, SUM(views) views FROM page_views WHERE day >= CURDATE() - INTERVAL 29 DAY GROUP BY path ORDER BY views DESC LIMIT 8');
  const [refs] = await pool.query(
    "SELECT ref, SUM(views) views FROM page_views WHERE ref <> '' AND day >= CURDATE() - INTERVAL 29 DAY GROUP BY ref ORDER BY views DESC LIMIT 8");
  const [[direct]] = await pool.query(
    "SELECT COALESCE(SUM(views), 0) n FROM page_views WHERE ref = '' AND day >= CURDATE() - INTERVAL 29 DAY");
  const [daily] = await pool.query(
    "SELECT DATE_FORMAT(day, '%Y-%m-%d') day, SUM(views) views FROM page_views WHERE day >= CURDATE() - INTERVAL 13 DAY GROUP BY day ORDER BY day");
  res.json({ today: Number(t.today), week: Number(t.week), month: Number(t.month), direct: Number(direct.n),
    pages: pages.map((x) => ({ ...x, views: Number(x.views) })), refs: refs.map((x) => ({ ...x, views: Number(x.views) })),
    daily: daily.map((x) => ({ day: x.day, views: Number(x.views) })) });
});

// Respaldo: descarga todo el contenido (menos las claves del administrador) en un solo archivo JSON
r.get('/backup', async (_q, res) => {
  const tables = ['systems', 'settings', 'messages', 'meetings', 'availability', 'blocked_days', 'page_views'];
  const data = {};
  for (const tb of tables) [data[tb]] = await pool.query(`SELECT * FROM ${tb}`);
  const stamp = new Date().toISOString().slice(0, 10);
  res.set('Content-Disposition', `attachment; filename="respaldo-portafolio-${stamp}.json"`);
  res.json({ app: 'portafolio', created_at: new Date().toISOString(), tables: data });
});

// Campanita: lo nuevo que requiere atención (mensajes sin leer y reuniones pendientes)
r.get('/notifications', async (_q, res) => {
  const [messages] = await pool.query('SELECT id, name, subject, message, created_at FROM messages WHERE is_read=0 ORDER BY created_at DESC LIMIT 8');
  const [meetings] = await pool.query("SELECT id, name, topic, start_at, created_at FROM meetings WHERE status='pending' ORDER BY created_at DESC LIMIT 8");
  const [[m]] = await pool.query('SELECT COUNT(*) n FROM messages WHERE is_read=0');
  const [[p]] = await pool.query("SELECT COUNT(*) n FROM meetings WHERE status='pending'");
  res.json({ unread: m.n, pending: p.n, total: m.n + p.n, messages, meetings });
});

const FIELDS = ['title_es', 'title_en', 'tagline_es', 'tagline_en', 'desc_es', 'desc_en', 'url', 'image_url', 'video_url', 'tags', 'sort_order', 'visible'];
const pick = (b) => FIELDS.map((f) => (f === 'visible' ? (b[f] ? 1 : 0) : f === 'sort_order' ? Number(b[f]) || 0 : String(b[f] ?? '')));

r.get('/systems', async (_q, res) => {
  const [rows] = await pool.query('SELECT * FROM systems ORDER BY sort_order, id');
  res.json(rows);
});
r.post('/systems', async (req, res) => {
  if (!req.body.title_es?.trim()) return res.status(400).json({ error: 'Título requerido' });
  const [x] = await pool.query(`INSERT INTO systems (${FIELDS.join(',')}) VALUES (${FIELDS.map(() => '?').join(',')})`, pick(req.body));
  res.json({ id: x.insertId });
});
// Reordena el catálogo: recibe los ids en el orden deseado y asigna sort_order 1..n
r.put('/systems-order', async (req, res) => {
  const ids = req.body.ids;
  if (!Array.isArray(ids) || !ids.every((n) => Number.isInteger(n))) return res.status(400).json({ error: 'Lista de ids inválida' });
  for (let i = 0; i < ids.length; i++) await pool.query('UPDATE systems SET sort_order=? WHERE id=?', [i + 1, ids[i]]);
  res.json({ ok: true });
});
r.put('/systems/:id', async (req, res) => {
  await pool.query(`UPDATE systems SET ${FIELDS.map((f) => f + '=?').join(',')} WHERE id=?`, [...pick(req.body), req.params.id]);
  res.json({ ok: true });
});
r.delete('/systems/:id', async (req, res) => {
  await pool.query('DELETE FROM systems WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

r.get('/messages', async (_q, res) => {
  const [rows] = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
  res.json(rows);
});
r.patch('/messages/:id', async (req, res) => {
  await pool.query('UPDATE messages SET is_read=? WHERE id=?', [req.body.is_read ? 1 : 0, req.params.id]);
  res.json({ ok: true });
});
r.delete('/messages/:id', async (req, res) => {
  await pool.query('DELETE FROM messages WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

r.get('/meetings', async (_q, res) => {
  const [rows] = await pool.query('SELECT * FROM meetings ORDER BY start_at DESC');
  res.json(rows);
});
r.patch('/meetings/:id', async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Estado inválido' });
  // al cancelar se libera el horario (slot_key = NULL)
  await pool.query(`UPDATE meetings SET status=?, slot_key=IF(?='cancelled', NULL, start_at) WHERE id=?`, [status, status, req.params.id]);
  res.json({ ok: true });
});

r.get('/availability', async (_q, res) => {
  const [rules] = await pool.query("SELECT id,weekday,TIME_FORMAT(start_time,'%H:%i') start_time,TIME_FORMAT(end_time,'%H:%i') end_time,active FROM availability ORDER BY weekday,start_time");
  const [blocked] = await pool.query("SELECT DATE_FORMAT(day,'%Y-%m-%d') day FROM blocked_days ORDER BY day");
  res.json({ rules, blocked: blocked.map((b) => b.day) });
});
r.put('/availability', async (req, res) => {
  const { rules = [], blocked = [] } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM availability');
    for (const x of rules)
      await conn.query('INSERT INTO availability (weekday,start_time,end_time,active) VALUES (?,?,?,?)', [x.weekday, x.start_time, x.end_time, x.active ? 1 : 0]);
    await conn.query('DELETE FROM blocked_days');
    for (const d of blocked) await conn.query('INSERT IGNORE INTO blocked_days (day) VALUES (?)', [d]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

const SETTING_KEYS = ['name', 'email', 'phone', 'whatsapp', 'location', 'linkedin', 'github', 'facebook', 'instagram', 'tiktok', 'youtube', 'x', 'experience', 'education', 'testimonials', 'photo'];
const LINK_KEYS = ['linkedin', 'github', 'facebook', 'instagram', 'tiktok', 'youtube', 'x'];

r.get('/settings', async (_q, res) => {
  const [rows] = await pool.query('SELECT k, v FROM settings');
  res.json(Object.fromEntries(rows.map((x) => [x.k, x.v])));
});
r.put('/settings', async (req, res) => {
  const b = req.body || {};
  const clean = {};
  for (const k of SETTING_KEYS) {
    if (b[k] === undefined) continue;
    let v = String(b[k]).trim().slice(0, ['experience', 'education', 'testimonials'].includes(k) ? 20000 : 200);
    if (LINK_KEYS.includes(k) && v && !/^https?:\/\//i.test(v)) return res.status(400).json({ error: `${k}: el enlace debe empezar con https://` });
    if (['phone', 'whatsapp'].includes(k) && v && !/^[+\d][\d\s().-]{5,}$/.test(v)) return res.status(400).json({ error: `${k}: número inválido` });
    if (['experience', 'education', 'testimonials'].includes(k)) {
      try { const a = JSON.parse(v || '[]'); if (!Array.isArray(a)) throw new Error(); } catch { return res.status(400).json({ error: `${k} inválido` }); }
    }
    clean[k] = v;
  }
  for (const [k, v] of Object.entries(clean))
    await pool.query('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)', [k, v]);
  res.json({ ok: true });
});

r.post('/password', async (req, res) => {
  const { current, next } = req.body || {};
  if (!next || next.length < 10) return res.status(400).json({ error: 'Mínimo 10 caracteres' });
  const [[a]] = await pool.query('SELECT * FROM admins WHERE id=?', [req.admin.id]);
  if (!(await bcrypt.compare(current || '', a.password_hash))) return res.status(401).json({ error: 'Clave actual incorrecta' });
  await pool.query('UPDATE admins SET password_hash=? WHERE id=?', [await bcrypt.hash(next, 12), a.id]);
  res.json({ ok: true });
});

export default r;
