import test, { mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { esc, oneLine, contactMail, meetingMail, clientMeetingMail } from '../src/mailTemplates.js';
import { sendMail, notifyClient, mailConfigured, clientsEnabled } from '../src/mail.js';

const saved = { key: process.env.RESEND_API_KEY, clients: process.env.MAIL_CLIENTS, from: process.env.MAIL_FROM };
beforeEach(() => { delete process.env.RESEND_API_KEY; delete process.env.MAIL_CLIENTS; delete process.env.MAIL_FROM; });
afterEach(() => {
  mock.restoreAll();
  for (const [k, v] of [['RESEND_API_KEY', saved.key], ['MAIL_CLIENTS', saved.clients], ['MAIL_FROM', saved.from]]) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
});

const fakeFetch = (status, body) => mock.method(globalThis, 'fetch', async () => ({ ok: status < 400, status, json: async () => body }));

test('esc neutraliza HTML y oneLine quita saltos de línea', () => {
  assert.equal(esc('<img src=x onerror="a">&\''), '&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;');
  assert.equal(oneLine('Hola\r\nBcc: x@y.com\n  fin'), 'Hola Bcc: x@y.com fin');
  assert.equal(oneLine('a'.repeat(300), 50).length, 50);
});

test('contactMail escapa el contenido del visitante y limpia el asunto', () => {
  const m = contactMail({ name: '<b>Ana</b>', email: 'ana@x.com', subject: 'Hola\nBcc: otro@x.com', message: '<script>alert(1)</script>\nlinea 2' }, 'https://sitio.app/admin');
  assert.ok(!m.html.includes('<script>'));
  assert.ok(m.html.includes('&lt;script&gt;'));
  assert.ok(m.html.includes('linea 2'));
  assert.ok(!/[\r\n]/.test(m.subject));
  assert.equal(m.replyTo, 'ana@x.com');
  assert.ok(m.text.includes('https://sitio.app/admin'));
});

test('meetingMail incluye fecha, hora y tema', () => {
  const m = meetingMail({ name: 'Luis', email: 'l@x.com', phone: '+504 1', topic: 'Sistema de inventario', date: '2026-12-01', time: '10:00' });
  assert.ok(m.subject.includes('2026-12-01 10:00'));
  assert.ok(m.html.includes('Sistema de inventario') && m.html.includes('+504 1'));
});

test('clientMeetingMail genera los tres estados y rechaza uno inválido', () => {
  const d = { name: 'Luis', date: '2026-12-01', time: '10:00' };
  assert.ok(clientMeetingMail('received', d, 'Kevin').text.includes('Recibí'));
  assert.ok(clientMeetingMail('confirmed', d).subject.includes('confirmada'));
  assert.ok(clientMeetingMail('cancelled', d).subject.includes('cancelada'));
  assert.throws(() => clientMeetingMail('otro', d));
});

test('sin RESEND_API_KEY no se envía nada y no falla', async () => {
  const f = fakeFetch(200, {});
  assert.equal(mailConfigured(), false);
  const r = await sendMail({ to: 'a@b.com', subject: 's', html: 'h', text: 't' });
  assert.equal(r.ok, false);
  assert.equal(r.skipped, true);
  assert.equal(f.mock.callCount(), 0);
});

test('sendMail llama a Resend con la clave, el remitente y el destinatario', async () => {
  process.env.RESEND_API_KEY = 're_test_123';
  const f = fakeFetch(200, { id: 'abc' });
  const r = await sendMail({ to: 'yo@x.com', subject: 'Asunto', html: '<p>h</p>', text: 't', replyTo: 'cli@x.com' });
  assert.deepEqual(r, { ok: true, id: 'abc' });
  const [url, opts] = f.mock.calls[0].arguments;
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(opts.headers.Authorization, 'Bearer re_test_123');
  const body = JSON.parse(opts.body);
  assert.deepEqual(body.to, ['yo@x.com']);
  assert.equal(body.reply_to, 'cli@x.com');
  assert.equal(body.from, 'Portafolio <onboarding@resend.dev>');
});

test('sendMail respeta MAIL_FROM', async () => {
  process.env.RESEND_API_KEY = 're_test_123';
  process.env.MAIL_FROM = 'Kevin <hola@midominio.com>';
  const f = fakeFetch(200, { id: '1' });
  await sendMail({ to: 'a@b.com', subject: 's', html: 'h', text: 't' });
  assert.equal(JSON.parse(f.mock.calls[0].arguments[1].body).from, 'Kevin <hola@midominio.com>');
});

test('errores de Resend y de red se devuelven, nunca se lanzan', async () => {
  process.env.RESEND_API_KEY = 're_test_123';
  fakeFetch(403, { message: 'Solo puedes enviar a tu propio correo' });
  assert.deepEqual(await sendMail({ to: 'x@y.com', subject: 's', html: 'h', text: 't' }), { ok: false, error: 'Solo puedes enviar a tu propio correo' });
  mock.restoreAll();
  mock.method(globalThis, 'fetch', async () => { throw new Error('ECONNRESET'); });
  const r = await sendMail({ to: 'x@y.com', subject: 's', html: 'h', text: 't' });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'ECONNRESET');
});

test('los correos a visitantes requieren MAIL_CLIENTS=true', async () => {
  process.env.RESEND_API_KEY = 're_test_123';
  const f = fakeFetch(200, { id: '1' });
  assert.equal(clientsEnabled(), false);
  notifyClient('cli@x.com', { subject: 's', html: 'h', text: 't' });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(f.mock.callCount(), 0);

  process.env.MAIL_CLIENTS = 'true';
  notifyClient('cli@x.com', { subject: 's', html: 'h', text: 't' });
  notifyClient('no-es-un-correo', { subject: 's', html: 'h', text: 't' });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(f.mock.callCount(), 1);
});
