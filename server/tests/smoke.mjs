// Prueba de humo contra un sitio ya desplegado (o local):  npm run smoke -- https://tu-sitio.up.railway.app
// No crea datos reales ni inicia sesión; solo comprueba que lo esencial responde como debe.
const BASE = (process.argv[2] || process.env.BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

const results = [];
async function check(name, fn) {
  try { await fn(); results.push([true, name]); console.log(`  ✓ ${name}`); }
  catch (e) { results.push([false, name]); console.log(`  ✗ ${name}\n      ${e.message}`); }
}
const ok = (cond, msg) => { if (!cond) throw new Error(msg); };
const req = (path, opts = {}) => fetch(BASE + path, { redirect: 'manual', ...opts });
const json = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': BROWSER_UA }, body: JSON.stringify(body) });

console.log(`Prueba de humo en ${BASE}\n`);

await check('inicio responde HTML con vista previa para compartir y sin marcadores', async () => {
  const r = await req('/'); const h = await r.text();
  ok(r.status === 200, `status ${r.status}`);
  ok(h.includes('og:title'), 'falta og:title');
  ok(!h.includes('__SITE_URL__'), 'quedó el marcador __SITE_URL__ sin reemplazar');
});
await check('robots.txt bloquea /admin y apunta al sitemap', async () => {
  const t = await (await req('/robots.txt')).text();
  ok(t.includes('Disallow: /admin') && t.includes('Sitemap:'), 'contenido inesperado');
});
await check('sitemap.xml es XML válido con el inicio', async () => {
  const t = await (await req('/sitemap.xml')).text();
  ok(t.includes('<urlset') && t.includes('<loc>'), 'no parece un sitemap');
});
await check('API pública: /api/systems devuelve una lista', async () => {
  const r = await req('/api/systems'); ok(r.status === 200, `status ${r.status}`);
  ok(Array.isArray(await r.json()), 'no es un arreglo');
});
await check('API pública: un proyecto inexistente da 404 en JSON', async () => {
  const r = await req('/api/systems/99999999'); ok(r.status === 404, `status ${r.status}`);
});
await check('API: una ruta inexistente da 404 en JSON (no la página principal)', async () => {
  const r = await req('/api/no-existe'); ok(r.status === 404, `status ${r.status}`);
  ok((r.headers.get('content-type') || '').includes('json'), 'no respondió JSON');
});
await check('/uploads: un archivo inexistente da 404 (no la página principal)', async () => {
  const r = await req('/uploads/no-existe.png'); ok(r.status === 404, `status ${r.status}`);
});
await check('rutas del front (/sobre-mi, /proyecto/1, /admin) sirven la aplicación', async () => {
  for (const p of ['/sobre-mi', '/proyecto/1', '/admin']) {
    const r = await req(p); ok(r.status === 200, `${p} → ${r.status}`);
  }
});
await check('agenda: fecha inválida da 400', async () => {
  const r = await req('/api/slots?date=ayer'); ok(r.status === 400, `status ${r.status}`);
});
await check('agenda: reservar con datos incompletos da 400', async () => {
  const r = await req('/api/meetings', json({ name: '', email: 'no-es-correo', date: '2030-01-01', time: '10:00' }));
  ok(r.status === 400, `status ${r.status}`);
});
await check('contacto: datos inválidos dan 400', async () => {
  const r = await req('/api/contact', json({ name: 'X', email: 'mal', message: '' })); ok(r.status === 400, `status ${r.status}`);
});
await check('contacto: el campo trampa (honeypot) responde ok sin guardar nada', async () => {
  const r = await req('/api/contact', json({ name: 'Bot', email: 'bot@example.com', message: 'spam', website: 'http://spam' }));
  ok(r.status === 200, `status ${r.status}`);
});
await check('seguimiento: ignora rutas del admin y robots (204 sin escribir)', async () => {
  const a = await req('/api/track', json({ path: '/admin' })); ok(a.status === 204, `admin → ${a.status}`);
  const b = await req('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Googlebot' }, body: JSON.stringify({ path: '/' }) });
  ok(b.status === 204, `bot → ${b.status}`);
});
await check('admin: sin sesión todo da 401', async () => {
  for (const p of ['/api/admin/stats', '/api/admin/messages', '/api/admin/backup', '/api/admin/analytics', '/api/admin/notifications']) {
    const r = await req(p); ok(r.status === 401, `${p} → ${r.status}`);
  }
});
await check('admin: credenciales incorrectas dan 401', async () => {
  const r = await req('/api/admin/login', json({ username: 'nadie', password: 'incorrecta-123' })); ok(r.status === 401, `status ${r.status}`);
});
await check('encabezados de seguridad presentes', async () => {
  const r = await req('/');
  ok(r.headers.get('x-content-type-options') === 'nosniff', 'falta X-Content-Type-Options');
  ok(!!r.headers.get('content-security-policy'), 'falta Content-Security-Policy');
});
await check('compresión activa para el JS', async () => {
  const html = await (await req('/')).text();
  const m = html.match(/src="(\/assets\/[^"]+\.js)"/); ok(m, 'no encontré el script principal');
  const r = await req(m[1], { headers: { 'Accept-Encoding': 'gzip' } });
  ok(/gzip|br/.test(r.headers.get('content-encoding') || ''), 'el JS no viene comprimido');
});

const failed = results.filter(([p]) => !p).length;
console.log(`\n${results.length - failed}/${results.length} pruebas correctas`);
process.exit(failed ? 1 : 0);
