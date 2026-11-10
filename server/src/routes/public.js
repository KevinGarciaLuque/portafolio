import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { buildSlots } from '../slots.js';
import { cleanPath, refHost, isBot } from '../analytics.js';

const r = Router();
const trackLimiter = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false });
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

r.get('/systems', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM systems WHERE visible=1 ORDER BY sort_order, id');
  res.json(rows);
});

r.get('/systems/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM systems WHERE id=? AND visible=1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});

r.get('/profile', async (_req, res) => {
  const [rows] = await pool.query('SELECT k, v FROM settings');
  res.json(Object.fromEntries(rows.map((x) => [x.k, x.v])));
});

r.post('/contact', limiter, async (req, res) => {
  const { name, email, subject = '', message, website } = req.body || {};
  if (website) return res.json({ ok: true }); // honeypot anti-bots
  if (!name?.trim() || !emailRe.test(email || '') || !message?.trim())
    return res.status(400).json({ error: 'Datos inválidos' });
  await pool.query('INSERT INTO messages (name,email,subject,message) VALUES (?,?,?,?)',
    [name.trim().slice(0, 120), email.trim().slice(0, 160), String(subject).slice(0, 200), message.trim().slice(0, 5000)]);
  res.json({ ok: true });
});

async function freeSlots(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return [];
  const [blocked] = await pool.query('SELECT 1 FROM blocked_days WHERE day=?', [dateStr]);
  if (blocked.length) return [];
  const [rules] = await pool.query('SELECT * FROM availability WHERE weekday=? AND active=1', [d.getDay()]);
  const [taken] = await pool.query(
    "SELECT TIME_FORMAT(start_at,'%H:%i') t FROM meetings WHERE DATE(start_at)=? AND status<>'cancelled'", [dateStr]);
  return buildSlots(dateStr, rules, new Set(taken.map((x) => x.t)));
}

// Cuenta una visita (la web la envía una sola vez por página y por sesión). Sin IP, sin cookies.
r.post('/track', trackLimiter, async (req, res) => {
  const path = cleanPath(req.body?.path);
  if (!path || isBot(req.get('user-agent'))) return res.status(204).end();
  const ref = refHost(req.body?.ref, req.get('host'));
  await pool.query(
    'INSERT INTO page_views (day, path, ref, views) VALUES (CURDATE(), ?, ?, 1) ON DUPLICATE KEY UPDATE views = views + 1',
    [path, ref]
  );
  res.status(204).end();
});

r.get('/slots', async (req, res) => {
  const date = String(req.query.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Fecha inválida' });
  res.json({ date, slots: await freeSlots(date) });
});

r.post('/meetings', limiter, async (req, res) => {
  const { name, email, phone = '', topic = '', date, time } = req.body || {};
  if (!name?.trim() || !emailRe.test(email || '') || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^\d{2}:\d{2}$/.test(time || ''))
    return res.status(400).json({ error: 'Datos inválidos' });
  if (!(await freeSlots(date)).includes(time)) return res.status(409).json({ error: 'Horario no disponible' });
  const start = `${date} ${time}:00`;
  try {
    await pool.query(
      'INSERT INTO meetings (name,email,phone,topic,start_at,slot_key) VALUES (?,?,?,?,?,?)',
      [name.trim().slice(0, 120), email.trim().slice(0, 160), String(phone).slice(0, 40), String(topic).slice(0, 3000), start, start]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Horario no disponible' });
    throw e;
  }
  res.json({ ok: true });
});

export default r;
