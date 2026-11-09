// Uso: npm run seq -- <video> <nombre> [--frames 120] [--format webp|avif] [--quality 70]
// Convierte un clip (p. ej. de Higgsfield) en secuencias de fotogramas optimizadas
// para escritorio (1280px) y móvil (720px) + poster + manifest.json
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const pos = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const [input, name] = pos;
if (!input || !name || !/^[a-z0-9_-]+$/i.test(name)) {
  console.error('Uso: npm run seq -- <video> <nombre> [--frames 120] [--format webp|avif] [--quality 70]');
  process.exit(1);
}
if (!existsSync(input)) { console.error('No existe el video:', input); process.exit(1); }

const frames = Number(flag('frames', 120));
const format = flag('format', 'webp');
const quality = Number(flag('quality', 70));
if (!['webp', 'avif'].includes(format) || !(frames >= 2)) { console.error('Parámetros inválidos'); process.exit(1); }

const out = resolve('public', 'sequences', name);
rmSync(out, { recursive: true, force: true });
const sets = { d: { width: 1280, q: quality }, m: { width: 720, q: Math.max(quality - 10, 40) } };

// 1) Duración del video para repartir exactamente N fotogramas
const probe = spawnSync(ffmpegPath, ['-i', input], { encoding: 'utf8' });
const dm = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(probe.stderr || '');
if (!dm) { console.error('No pude leer la duración del video'); process.exit(1); }
const duration = +dm[1] * 3600 + +dm[2] * 60 + +dm[3];
const fps = frames / duration;
console.log(`Video: ${duration.toFixed(2)}s -> ${frames} fotogramas (${fps.toFixed(2)} fps efectivos)`);

// 2) Extraer PNG temporales a 1280 px
const tmp = mkdtempSync(join(tmpdir(), 'seq-'));
const r = spawnSync(ffmpegPath, ['-y', '-i', input, '-vf', `fps=${fps},scale=1280:-2:flags=lanczos`, '-frames:v', String(frames), join(tmp, '%04d.png')], { stdio: ['ignore', 'ignore', 'inherit'] });
if (r.status !== 0) { console.error('ffmpeg falló'); process.exit(1); }
const files = readdirSync(tmp).filter((f) => f.endsWith('.png')).sort();
if (!files.length) { console.error('No se extrajeron fotogramas'); process.exit(1); }

// 2b) Opcional --soften <x>: limita y suaviza los picos de brillo (destellos bruscos).
//     Techo = x veces el brillo mediano; la ganancia se suaviza entre fotogramas vecinos.
const soften = Number(flag('soften', 0));
if (soften > 0) {
  const lum = [];
  for (const f of files) {
    const s = await sharp(join(tmp, f)).stats();
    lum.push(s.channels.slice(0, 3).reduce((a, c) => a + c.mean, 0) / 3);
  }
  const median = [...lum].sort((a, b) => a - b)[Math.floor(lum.length / 2)];
  const cap = median * soften;
  const raw = lum.map((l) => (l > cap ? cap / l : 1));
  const R = Math.max(3, Math.round(files.length * 0.05)); // radio de suavizado
  const gain = raw.map((_, i) => {
    let s = 0, n = 0;
    for (let j = Math.max(0, i - R); j <= Math.min(raw.length - 1, i + R); j++) { s += raw[j]; n++; }
    return Math.min(raw[i], s / n); // nunca por encima del recorte necesario
  });
  for (let i = 0; i < files.length; i++) {
    if (gain[i] >= 0.995) continue;
    const p = join(tmp, files[i]);
    const buf = await sharp(p).linear(gain[i], 0).png().toBuffer();
    writeFileSync(p, buf);
  }
  console.log(`  soften x${soften}: brillo máx ${Math.max(...lum).toFixed(0)} -> techo ${cap.toFixed(0)} (mediana ${median.toFixed(0)})`);
}

// 3) Convertir a WebP/AVIF en dos tamaños
const encode = (img, q) => (format === 'avif' ? img.avif({ quality: q, effort: 4 }) : img.webp({ quality: q, effort: 5 }));
let meta;
for (const [dir, cfg] of Object.entries(sets)) {
  mkdirSync(join(out, dir), { recursive: true });
  let bytes = 0;
  for (const f of files) {
    const img = sharp(join(tmp, f)).resize({ width: cfg.width });
    const info = await encode(img, cfg.q).toFile(join(out, dir, f.replace('.png', `.${format}`)));
    bytes += info.size;
    meta ??= { width: info.width, height: info.height };
    if (dir === 'd') meta = { width: info.width, height: info.height };
  }
  console.log(`  ${dir}: ${files.length} fotogramas, ${(bytes / 1048576).toFixed(1)} MB`);
}

// 4) Poster (fotograma intermedio) para modo estático
await sharp(join(tmp, files[Math.floor(files.length * 0.35)])).resize({ width: 1280 }).webp({ quality: 75 }).toFile(join(out, 'poster.webp'));

const pad = (n) => String(n).padStart(4, '0');
const manifest = { name, frames: files.length, ext: format, aspect: +(meta.width / meta.height).toFixed(4), poster: `poster.webp`, desktop: 'd', mobile: 'm', pad: 4 };
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
rmSync(tmp, { recursive: true, force: true });
console.log(`Listo: public/sequences/${name}/ (primer fotograma ${pad(1)}.${format})`);
