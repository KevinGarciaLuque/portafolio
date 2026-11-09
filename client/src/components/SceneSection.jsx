import { useLayoutEffect, useRef } from 'react';
import { gsap, useMotionMode } from '../lib/motion.js';
import ScrollSequence from './ScrollSequence.jsx';
import Starfield from './Starfield.jsx';

/**
 * Transición cinematográfica de entrada de una sección + escena de fondo opcional.
 * variants: curtain (cortina con clip-path) · zoom (empuje con desenfoque) · wipe (barrido lateral) · rise (ascenso)
 */
const FROM = {
  curtain: { clipPath: 'inset(16% 7% 16% 7% round 28px)', scale: 0.94, autoAlpha: 0.2 },
  zoom: { scale: 1.12, filter: 'blur(14px)', autoAlpha: 0 },
  wipe: { clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 1 },
  rise: { y: 120, autoAlpha: 0 },
};
const TO = {
  curtain: { clipPath: 'inset(0% 0% 0% 0% round 0px)', scale: 1, autoAlpha: 1 },
  zoom: { scale: 1, filter: 'blur(0px)', autoAlpha: 1 },
  wipe: { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1 },
  rise: { y: 0, autoAlpha: 1 },
};

export default function SceneSection({ variant = 'curtain', backdrop, hue = 190, children, className = '', id }) {
  const ref = useRef(null);
  const content = useRef(null);
  const motion = useMotionMode();

  useLayoutEffect(() => {
    if (motion !== 'live') return;
    const ctx = gsap.context(() => {
      const st = { trigger: ref.current, start: 'top 95%', end: 'top 35%', scrub: 0.7 };
      gsap.fromTo(content.current, FROM[variant], { ...TO[variant], ease: 'none', scrollTrigger: st });
      // "corte de escena": barrido de luz que cruza la pantalla al entrar
      gsap.fromTo('.cut-line', { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, ease: 'none', scrollTrigger: { ...st, end: 'top 55%' } });
      gsap.to('.cut-line', { autoAlpha: 0, scrollTrigger: { trigger: ref.current, start: 'top 45%', end: 'top 25%', scrub: true } });
      // parallax suave de los encabezados
      gsap.utils.toArray('.section-head').forEach((el) => {
        gsap.fromTo(el, { y: 50 }, { y: -30, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }, ref);
    return () => ctx.revert();
  }, [variant, motion]);

  return (
    <div ref={ref} className={`scene ${className}`} id={id}>
      {backdrop && <ScrollSequence name={backdrop} mode="backdrop" hue={hue} className="scene-backdrop" />}
      {/* estrellas del tamaño de la pantalla que acompañan al scroll dentro de la sección */}
      <div className="stars-sticky" aria-hidden="true"><Starfield density={0.7} /></div>
      <div className="cut-line" aria-hidden="true" />
      <div ref={content} className="scene-content">{children}</div>
    </div>
  );
}
