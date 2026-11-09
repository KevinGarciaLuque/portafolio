import { useEffect, useRef } from 'react';
import { useMotionMode } from '../lib/motion.js';

const COLORS = [[190, 245, 255], [255, 255, 255], [170, 200, 255], [205, 175, 255]];
const rnd = (i, n) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };

// Sprite con halo suave (se prepara una vez por color y se reutiliza: mucho más barato que gradientes por frame)
function makeSprite([r, g, b]) {
  const s = document.createElement('canvas');
  s.width = s.height = 64;
  const c = s.getContext('2d');
  const g2 = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g2.addColorStop(0, `rgba(${r},${g},${b},1)`);
  g2.addColorStop(0.18, `rgba(${r},${g},${b},.55)`);
  g2.addColorStop(0.5, `rgba(${r},${g},${b},.12)`);
  g2.addColorStop(1, `rgba(${r},${g},${b},0)`);
  c.fillStyle = g2;
  c.fillRect(0, 0, 64, 64);
  return s;
}

/**
 * Estrellas y partículas que brillan por sí solas (parpadeo + deriva lenta + parallax leve con el scroll).
 * Ahorro: se detiene fuera de pantalla o con la pestaña oculta; en modo estático dibuja un solo cuadro.
 */
export default function Starfield({ density = 1, className = '' }) {
  const ref = useRef(null);
  const motion = useMotionMode();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    const count = Math.round((mobile ? 55 : 120) * density);
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
    const sprites = COLORS.map(makeSprite);
    const stars = Array.from({ length: count }, (_, i) => ({
      x: rnd(i, 1), y: rnd(i, 2),
      depth: 0.3 + rnd(i, 3) * 0.7,             // más profundo = más pequeño y lento
      size: 5 + rnd(i, 4) * 15,                  // px del halo
      phase: rnd(i, 5) * Math.PI * 2,
      speed: 0.6 + rnd(i, 6) * 1.8,              // velocidad del parpadeo
      color: Math.floor(rnd(i, 7) * COLORS.length),
      sparkle: rnd(i, 8) > 0.82,                 // algunas brillan con destello en cruz
    }));

    let w = 0, h = 0, raf = 0, visible = true, running = false;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * dpr)); h = Math.max(1, Math.round(r.height * dpr));
      canvas.width = w; canvas.height = h;
      draw(performance.now());
    };

    function draw(now) {
      const t = now / 1000;
      const sy = window.scrollY;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = Math.sin(t * s.speed + s.phase);
        const a = 0.25 + 0.75 * tw * tw;                 // parpadeo suave 0.25 → 1
        // deriva lenta hacia arriba + parallax con el scroll
        const yy = (((s.y - t * 0.006 * s.depth - sy * 0.00006 * s.depth) % 1) + 1) % 1;
        const xx = (s.x + Math.sin(t * 0.05 * s.depth + s.phase) * 0.004 + 1) % 1;
        const x = xx * w, y = yy * h;
        const size = s.size * s.depth * dpr * (0.8 + 0.4 * a);
        ctx.globalAlpha = a * (0.45 + 0.55 * s.depth);
        ctx.drawImage(sprites[s.color], x - size / 2, y - size / 2, size, size);
        if (s.sparkle && a > 0.7) {
          // destello en cruz cuando alcanza su máximo brillo
          const L = size * 1.05 * (a - 0.7) / 0.3;
          ctx.globalAlpha = (a - 0.7) * 1.6;
          ctx.strokeStyle = 'rgba(215,245,255,1)';
          ctx.lineWidth = Math.max(1, dpr * 0.8);
          ctx.beginPath();
          ctx.moveTo(x - L, y); ctx.lineTo(x + L, y);
          ctx.moveTo(x, y - L); ctx.lineTo(x, y + L);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    const loop = (now) => {
      if (!running) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    const update = () => {
      const should = motion === 'live' && visible && !document.hidden;
      if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
      if (!should && running) { running = false; cancelAnimationFrame(raf); }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); }, { rootMargin: '100px' });
    io.observe(canvas);
    document.addEventListener('visibilitychange', update);
    resize();
    update();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, [motion, density]);

  return <canvas ref={ref} className={`stars ${className}`} aria-hidden="true" />;
}
