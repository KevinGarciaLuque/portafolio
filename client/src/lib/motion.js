import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };

/** Dispositivo con pocos recursos: ahorro de datos, <=2 GB RAM o <=2 núcleos. */
function isLowEnd() {
  const n = navigator;
  return !!(n.connection?.saveData || (n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2));
}

/** 'live' = animación por scroll; 'static' = alternativa estática. Forzable con ?static=1 / ?live=1 */
export function useMotionMode() {
  const compute = () => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('static') === '1') return 'static';
    if (q.get('live') === '1') return 'live';
    // «Ahorro de datos» del navegador: no descargar cientos de fotogramas, solo el póster
    const saveData = !!navigator.connection?.saveData;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || isLowEnd() || saveData ? 'static' : 'live';
  };
  const [mode, setMode] = useState(compute);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setMode(compute());
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return mode;
}

let refreshTimer;
/** Recalcula posiciones tras cambios de altura (contenido cargado, fuentes, etc.) */
export function refreshScroll(delay = 150) {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), delay);
}
