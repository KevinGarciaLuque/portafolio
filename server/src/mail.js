import { pool } from './db.js';
import { setSetting } from './cv.js';

const env = (k) => String(process.env[k] || '').trim();
const apiUrl = () => env('RESEND_API_URL') || 'https://api.resend.com/emails'; // RESEND_API_URL solo se usa en pruebas
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const mailConfigured = () => !!env('RESEND_API_KEY');
/** Correos a los visitantes (confirmaciones): solo con un dominio verificado en Resend y MAIL_CLIENTS=true */
export const clientsEnabled = () => env('MAIL_CLIENTS').toLowerCase() === 'true';
export const mailFrom = () => env('MAIL_FROM') || 'Portafolio <onboarding@resend.dev>';

/**
 * Envía un correo por la API de Resend (HTTPS: funciona en Railway, que bloquea SMTP en los planes básicos).
 * Nunca lanza: devuelve { ok, error }.
 */
export async function sendMail({ to, subject, html, text, replyTo }) {
  if (!mailConfigured()) return { ok: false, skipped: true, error: 'Falta la variable RESEND_API_KEY' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(apiUrl(), {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: mailFrom(), to: Array.isArray(to) ? to : [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: data.message || `Resend respondió ${r.status}` };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e.name === 'AbortError' ? 'Tiempo de espera agotado' : e.message };
  } finally {
    clearTimeout(timer);
  }
}

/** Configuración de avisos: activados por defecto (en cuanto exista RESEND_API_KEY); destino = correo de avisos o el correo público. */
export async function getNotify() {
  const [rows] = await pool.query("SELECT k, v FROM settings WHERE k IN ('notify_enabled', 'notify_email', 'email')");
  const s = Object.fromEntries(rows.map((r) => [r.k, r.v]));
  const custom = (s.notify_email || '').trim();
  return { enabled: s.notify_enabled !== 'false', custom, to: custom || (s.email || '').trim() };
}

export async function saveNotify({ enabled, email }) {
  if (email && !emailRe.test(email)) throw Object.assign(new Error('Correo inválido'), { status: 400 });
  await setSetting('notify_enabled', enabled ? 'true' : 'false');
  await setSetting('notify_email', email || '');
}

/** Avisa al dueño sin bloquear ni romper la petición del visitante (se ejecuta en segundo plano). */
export function notifyOwner(mail) {
  (async () => {
    if (!mailConfigured()) return;
    const n = await getNotify();
    if (!n.enabled || !emailRe.test(n.to)) return;
    const r = await sendMail({ to: n.to, ...mail });
    if (!r.ok) console.error('Aviso por correo falló:', r.error);
  })().catch((e) => console.error('Aviso por correo falló:', e.message));
}

/** Correo al visitante (confirmaciones). Solo si el administrador lo habilitó con MAIL_CLIENTS=true. */
export function notifyClient(to, mail) {
  if (!mailConfigured() || !clientsEnabled() || !emailRe.test(to || '')) return;
  sendMail({ to, ...mail }).then((r) => { if (!r.ok) console.error('Correo al visitante falló:', r.error); })
    .catch((e) => console.error('Correo al visitante falló:', e.message));
}

export async function getOwnerName() {
  const [rows] = await pool.query("SELECT v FROM settings WHERE k = 'name'");
  return (rows[0]?.v || '').trim();
}
