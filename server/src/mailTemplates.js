// Plantillas de correo (funciones puras: fáciles de probar y sin acceso a la base de datos)

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Una sola línea (los asuntos no deben llevar saltos de línea) */
export const oneLine = (s, max = 120) => String(s ?? '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, max);

const row = (label, value) =>
  value ? `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0;color:#111">${esc(value).replace(/\n/g, '<br>')}</td></tr>` : '';

function layout(title, rows, footerHtml = '') {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#111">
<h2 style="margin:0 0 14px;font-size:20px">${esc(title)}</h2>
<table style="border-collapse:collapse;font-size:15px;line-height:1.5">${rows}</table>
${footerHtml ? `<p style="margin-top:22px;font-size:14px">${footerHtml}</p>` : ''}
</div>`;
}

const adminLink = (url) => (url ? `<a href="${esc(url)}">Abrir el panel administrativo</a>` : '');
const lines = (pairs) => pairs.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');

/** Aviso al dueño: alguien envió el formulario «Cuéntame tu proyecto» */
export function contactMail({ name, email, subject, message }, adminUrl = '') {
  return {
    subject: `Nuevo mensaje de ${oneLine(name, 60)}${subject ? ` — ${oneLine(subject, 70)}` : ''}`,
    replyTo: email,
    html: layout('Nuevo mensaje desde tu portafolio',
      row('Nombre', name) + row('Correo', email) + row('Asunto', subject) + row('Mensaje', message), adminLink(adminUrl)),
    text: `Nuevo mensaje desde tu portafolio\n\n${lines([['Nombre', name], ['Correo', email], ['Asunto', subject]])}\n\n${message}\n${adminUrl ? `\n${adminUrl}` : ''}`,
  };
}

/** Aviso al dueño: alguien pidió una reunión */
export function meetingMail({ name, email, phone, topic, date, time }, adminUrl = '') {
  return {
    subject: `Nueva reunión solicitada: ${date} ${time} — ${oneLine(name, 60)}`,
    replyTo: email,
    html: layout('Nueva solicitud de reunión',
      row('Fecha', date) + row('Hora', time) + row('Nombre', name) + row('Correo', email) + row('Teléfono', phone) + row('Tema', topic), adminLink(adminUrl)),
    text: `Nueva solicitud de reunión\n\n${lines([['Fecha', date], ['Hora', time], ['Nombre', name], ['Correo', email], ['Teléfono', phone], ['Tema', topic]])}\n${adminUrl ? `\n${adminUrl}` : ''}`,
  };
}

const CLIENT = {
  received: (n) => ({ subject: `Recibí tu solicitud de reunión`, title: 'Recibí tu solicitud', body: `Hola ${n.name}, gracias por agendar. Recibí tu solicitud para el ${n.date} a las ${n.time} y te confirmaré por este medio.` }),
  confirmed: (n) => ({ subject: `Reunión confirmada: ${n.date} ${n.time}`, title: 'Reunión confirmada', body: `Hola ${n.name}, tu reunión del ${n.date} a las ${n.time} quedó confirmada. Si necesitas cambiarla, responde a este correo.` }),
  cancelled: (n) => ({ subject: `Reunión cancelada: ${n.date} ${n.time}`, title: 'Reunión cancelada', body: `Hola ${n.name}, tuve que cancelar la reunión del ${n.date} a las ${n.time}. Puedes elegir otro horario en el sitio o responder a este correo.` }),
};

/** Correo al visitante sobre su reunión. kind: received | confirmed | cancelled */
export function clientMeetingMail(kind, { name, date, time }, ownerName = '') {
  const build = CLIENT[kind];
  if (!build) throw new Error(`kind inválido: ${kind}`);
  const c = build({ name: oneLine(name, 60), date, time });
  const sign = ownerName ? `— ${oneLine(ownerName, 60)}` : '';
  return {
    subject: c.subject,
    html: layout(c.title, `<tr><td style="font-size:15px;line-height:1.6">${esc(c.body)}</td></tr>`, esc(sign)),
    text: `${c.body}\n\n${sign}`.trim(),
  };
}
