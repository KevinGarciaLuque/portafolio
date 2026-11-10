// Analítica propia y respetuosa con la privacidad: no se guarda IP, ni cookies, ni identificadores de personas.
// Solo se cuenta cuántas visitas tuvo cada página por día y de qué sitio llegaron.

const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|curl|wget|python-requests/i;

/** true si el User-Agent parece un robot (no se cuenta como visita) */
export const isBot = (ua) => !ua || BOT_RE.test(ua);

/** Normaliza la ruta: sin parámetros ni ancla, solo rutas públicas. Devuelve null si no es válida. */
export function cleanPath(raw) {
  if (typeof raw !== 'string') return null;
  const p = raw.split(/[?#]/)[0].trim();
  if (!/^\/[A-Za-z0-9\-._~/%]*$/.test(p) || p.length > 190) return null;
  if (p === '/admin' || p.startsWith('/admin/') || p === '/api' || p.startsWith('/api/')) return null;
  return p.length > 1 ? p.replace(/\/+$/, '') : p;
}

/** Solo el dominio de origen (sin ruta ni parámetros). Vacío si es el propio sitio, directo o inválido. */
export function refHost(raw, ownHost = '') {
  if (typeof raw !== 'string' || !raw) return '';
  try {
    const h = new URL(raw).hostname.replace(/^www\./, '').toLowerCase();
    if (!h || h.length > 190) return '';
    if (ownHost && h === String(ownHost).replace(/:\d+$/, '').replace(/^www\./, '').toLowerCase()) return '';
    return h;
  } catch {
    return '';
  }
}
