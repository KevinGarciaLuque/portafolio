import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, useMotionMode } from '../lib/motion.js';
import { loadManifest, FrameStore, drawCover, drawProcedural } from '../lib/sequence.js';

/**
 * Secuencia de fotogramas controlada por scroll.
 *  - mode "pin":      la escena se fija en pantalla y el scroll avanza la animación (hero).
 *  - mode "backdrop": canvas de fondo que avanza mientras la sección cruza la pantalla.
 *  - setup(tl, root): permite añadir animaciones HTML a la misma línea de tiempo (0 → 1).
 * Sin fotogramas (aún) usa una escena procedural; en modo estático dibuja un único cuadro.
 */
export default function ScrollSequence({ name, mode = 'pin', scroll = '+=320%', hue = 190, smooth = 0.6, setup, className = '', children, ...rest }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const motion = useMotionMode();
  const [manifest, setManifest] = useState(undefined); // undefined = cargando, null = no existe

  useEffect(() => {
    let alive = true;
    loadManifest(name).then((m) => alive && setManifest(m));
    return () => { alive = false; };
  }, [name]);

  useLayoutEffect(() => {
    if (manifest === undefined) return;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    const live = motion === 'live';
    const state = { p: live ? 0 : 0.35 };
    let w = 0, h = 0, raf = 0;
    let store = null;
    let poster = null;

    const draw = () => {
      raf = 0;
      if (!w) return;
      if (store) {
        const img = store.nearest(Math.round(state.p * (store.n - 1)));
        if (img) return drawCover(ctx, img, w, h);
      } else if (poster) {
        return drawCover(ctx, poster, w, h);
      }
      drawProcedural(ctx, w, h, state.p, hue);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      const r = canvas.parentElement.getBoundingClientRect();
      w = Math.round(r.width * dpr); h = Math.round(r.height * dpr);
      canvas.width = w; canvas.height = h;
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    resize();

    let io, gctx;
    if (manifest) {
      if (live) {
        store = new FrameStore(manifest, mobile, schedule);
        if (mode === 'pin') store.start();
        else {
          io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { store.start(); io.disconnect(); } }, { rootMargin: '1500px 0px' });
          io.observe(root);
        }
      } else {
        // modo estático: solo se descarga el poster (una imagen)
        const img = new Image();
        img.onload = () => { poster = img; schedule(); };
        img.src = `/sequences/${manifest.name}/${manifest.poster}`;
      }
    }

    if (live) {
      gctx = gsap.context(() => {
        const isPin = mode === 'pin';
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root,
            start: isPin ? 'top top' : 'top bottom',
            end: isPin ? scroll : 'bottom top',
            scrub: smooth,
            pin: isPin,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        tl.to(state, { p: 1, duration: 1, onUpdate: schedule }, 0);
        setup?.(tl, root);
      }, root);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      gctx?.revert();
      store?.dispose();
    };
  }, [manifest, motion, mode, scroll, hue, smooth]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={rootRef} className={`seq seq-${mode} ${motion === 'live' ? 'live' : 'static'} ${className}`} {...rest}>
      <div className="seq-stage">
        <canvas ref={canvasRef} className="seq-canvas" aria-hidden="true" />
        <div className="seq-vignette" />
        {children}
      </div>
    </div>
  );
}
