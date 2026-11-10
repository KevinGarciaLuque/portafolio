import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { pool, UPLOAD_DIR } from '../db.js';
import { requireAdmin, signToken } from '../auth.js';

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

r.get('/stats', async (_q, res) => {
  const [[s]] = await pool.query('SELECT COUNT(*) n FROM systems');
  const [[m]] = await pool.query('SELECT COUNT(*) n FROM messages WHERE is_read=0');
  const [[p]] = await pool.query("SELECT COUNT(*) n FROM meetings WHERE status='pending'");
  const [[u]] = await pool.query("SELECT COUNT(*) n FROM meetings WHERE status<>'cancelled' AND start_at>=NOW()");
  res.json({ systems: s.n, unread: m.n, pending: p.n, upcoming: u.n });
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

const SETTING_KEYS = ['name', 'email', 'phone', 'whatsapp', 'location', 'linkedin', 'github', 'facebook', 'instagram', 'tiktok', 'youtube', 'x', 'experience', 'education', 'photo'];
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
    let v = String(b[k]).trim().slice(0, ['experience', 'education'].includes(k) ? 20000 : 200);
    if (LINK_KEYS.includes(k) && v && !/^https?:\/\//i.test(v)) return res.status(400).json({ error: `${k}: el enlace debe empezar con https://` });
    if (['phone', 'whatsapp'].includes(k) && v && !/^[+\d][\d\s().-]{5,}$/.test(v)) return res.status(400).json({ error: `${k}: número inválido` });
    if (k === 'experience' || k === 'education') {
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
