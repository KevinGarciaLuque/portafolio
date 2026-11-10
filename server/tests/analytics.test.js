import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPath, refHost, isBot } from '../src/analytics.js';

test('cleanPath: acepta rutas públicas y quita parámetros y ancla', () => {
  assert.equal(cleanPath('/'), '/');
  assert.equal(cleanPath('/sobre-mi'), '/sobre-mi');
  assert.equal(cleanPath('/proyecto/3?utm_source=x#top'), '/proyecto/3');
  assert.equal(cleanPath('/sobre-mi/'), '/sobre-mi');
});

test('cleanPath: rechaza el admin, la API y valores raros', () => {
  for (const bad of ['/admin', '/admin/x', '/api', '/api/systems', 'sin-barra', '', null, undefined, 42, {}, '/a b', '/<script>', 'javascript:alert(1)']) {
    assert.equal(cleanPath(bad), null, `debería rechazar ${JSON.stringify(bad)}`);
  }
});

test('cleanPath: rechaza rutas demasiado largas', () => {
  assert.equal(cleanPath('/' + 'a'.repeat(200)), null);
});

test('refHost: deja solo el dominio de origen', () => {
  assert.equal(refHost('https://www.google.com/search?q=kevin'), 'google.com');
  assert.equal(refHost('https://l.facebook.com/l.php?u=abc'), 'l.facebook.com');
  assert.equal(refHost('https://WWW.LinkedIn.com/in/x'), 'linkedin.com');
});

test('refHost: ignora tráfico directo, inválido o del propio sitio', () => {
  assert.equal(refHost(''), '');
  assert.equal(refHost(undefined), '');
  assert.equal(refHost('no es una url'), '');
  assert.equal(refHost('https://portafoliok.up.railway.app/sobre-mi', 'portafoliok.up.railway.app'), '');
  assert.equal(refHost('http://localhost:5173/', 'localhost:4000'), '');
});

test('isBot: detecta robots y clientes sin User-Agent', () => {
  assert.equal(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
  assert.equal(isBot('Lighthouse'), true);
  assert.equal(isBot('curl/8.0'), true);
  assert.equal(isBot(''), true);
  assert.equal(isBot(undefined), true);
  assert.equal(isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'), false);
});
