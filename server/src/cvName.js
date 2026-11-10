/** Nombre con el que el navegador guarda el CV: "CV-Kevin-Garcia.pdf" (sin tildes ni caracteres raros). */
export function cvDownloadName(name) {
  const base = String(name || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `CV-${base || 'curriculum'}.pdf`;
}

/** Nombre original del archivo subido, para mostrarlo en el panel (sin rutas, recortado). */
export function cleanOriginalName(raw) {
  const s = String(raw || '').split(/[\\/]/).pop().replace(/[\u0000-\u001f<>"]/g, '').trim();
  return s.slice(0, 120) || 'cv.pdf';
}

/** Un PDF real empieza con "%PDF-" (no basta con confiar en la extensión). */
export function looksLikePdf(buf) {
  return Buffer.isBuffer(buf) && buf.length > 8 && buf.subarray(0, 5).toString('latin1') === '%PDF-';
}

/** Solo nombres generados por la app: evita que un valor manipulado apunte fuera de la carpeta privada. */
export const isCvFileName = (s) => /^cv-[a-f0-9]{24}\.pdf$/.test(String(s || ''));
