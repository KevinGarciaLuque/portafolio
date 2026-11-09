// Carga y dibujo de secuencias de fotogramas (generadas con tools/build-sequence.mjs)

export async function loadManifest(name) {
  try {
    const r = await fetch(`/sequences/${name}/manifest.json`, { cache: 'no-cache' });
    if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return null;
    const m = await r.json();
    return m?.frames > 1 ? m : null;
  } catch {
    return null;
  }
}

/** Orden de carga progresivo: primero fotogramas espaciados (el scroll ya "funciona"), luego se rellenan. */
function loadOrder(n) {
  const seen = new Set();
  const order = [];
  for (const step of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < n; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
  }
  if (!seen.has(n - 1)) order.push(n - 1);
  return order;
}

export class FrameStore {
  constructor(manifest, mobile, onFrame) {
    this.n = manifest.frames;
    this.dir = mobile ? manifest.mobile : manifest.desktop;
    this.base = `/sequences/${manifest.name}/${this.dir}/`;
    this.ext = manifest.ext;
    this.pad = manifest.pad || 4;
    this.images = new Array(this.n).fill(null);
    this.loaded = 0;
    this.onFrame = onFrame;
    this.started = false;
    this.disposed = false;
    this.concurrency = mobile ? 3 : 6;
  }

  url(i) { return `${this.base}${String(i + 1).padStart(this.pad, '0')}.${this.ext}`; }

  start() {
    if (this.started) return;
    this.started = true;
    const queue = loadOrder(this.n);
    let active = 0;
    const next = () => {
      while (!this.disposed && active < this.concurrency && queue.length) {
        const i = queue.shift();
        active++;
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => { if (this.disposed) return; this.images[i] = img; this.loaded++; active--; this.onFrame?.(i); next(); };
        img.onerror = () => { active--; next(); };
        img.src = this.url(i);
      }
    };
    next();
  }

  /** Fotograma cargado más cercano al índice pedido (evita "parpadeos" mientras se descarga). */
  nearest(i) {
    if (this.images[i]) return this.images[i];
    for (let d = 1; d < this.n; d++) {
      if (i - d >= 0 && this.images[i - d]) return this.images[i - d];
      if (i + d < this.n && this.images[i + d]) return this.images[i + d];
    }
    return null;
  }

  dispose() {
    this.disposed = true;
    this.images.fill(null);
  }
}

/** Dibuja la imagen cubriendo el canvas (object-fit: cover) */
export function drawCover(ctx, img, w, h) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const s = Math.max(w / iw, h / ih);
  const dw = iw * s, dh = ih * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/* ---------- Escena procedural de respaldo: galaxia (mientras no existan fotogramas de Higgsfield) ---------- */
const rnd = (i, n) => { const x = Math.sin(i * 999.7 + n * 78.233) * 43758.5453; return x - Math.floor(x); };

// Tres capas de estrellas con distinta profundidad (parallax)
const LAYERS = [
  { count: 170, size: 0.7, speed: 0.10, alpha: 0.55 },
  { count: 90, size: 1.3, speed: 0.22, alpha: 0.8 },
  { count: 35, size: 2.1, speed: 0.42, alpha: 1 },
].map((L, li) => ({
  ...L,
  stars: Array.from({ length: L.count }, (_, i) => ({ x: rnd(i + li * 500, 1), y: rnd(i + li * 500, 2), t: rnd(i + li * 500, 3) })),
}));

// Nebulosas: manchas suaves de color que derivan lentamente
const NEBULAE = [
  { x: 0.2, y: 0.3, r: 0.55, h: 0, a: 0.22, dx: 0.10, dy: -0.06 },
  { x: 0.78, y: 0.62, r: 0.6, h: 35, a: 0.2, dx: -0.12, dy: 0.05 },
  { x: 0.5, y: 0.95, r: 0.5, h: 90, a: 0.18, dx: 0.06, dy: -0.10 },
  { x: 0.9, y: 0.12, r: 0.35, h: -25, a: 0.14, dx: -0.05, dy: 0.08 },
];

export function drawProcedural(ctx, w, h, p, hue = 190) {
  ctx.fillStyle = '#03060c';
  ctx.fillRect(0, 0, w, h);
  const big = Math.max(w, h);

  for (const n of NEBULAE) {
    const x = (n.x + n.dx * p) * w, y = (n.y + n.dy * p) * h, r = n.r * big;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `hsla(${hue + n.h}, 90%, 55%, ${n.a})`);
    g.addColorStop(0.5, `hsla(${hue + n.h + 25}, 80%, 40%, ${n.a * 0.35})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  for (const L of LAYERS) {
    const sz = L.size * (big / 1400 + 0.6);
    for (const s of L.stars) {
      const y = ((s.y - p * L.speed) % 1 + 1) % 1;
      const k = 0.55 + 0.45 * Math.sin(s.t * 40 + p * 6); // brillo que varía con el scroll (quieto al detenerse)
      ctx.fillStyle = `hsla(${hue + s.t * 40}, 90%, 88%, ${L.alpha * k})`;
      ctx.fillRect(s.x * w, y * h, sz, sz);
    }
  }
}
