import { useLayoutEffect, useRef } from 'react';
import { gsap, useMotionMode } from '../lib/motion.js';
import { useLang } from '../i18n.jsx';
import { useProfile } from '../profileContext.jsx';

export default function Experience() {
  const { t, lang } = useLang();
  const { profile } = useProfile();
  const ref = useRef(null);
  const motion = useMotionMode();
  const items = profile.experience;

  // La línea de tiempo se "dibuja" con el scroll y cada hito entra alternando lados
  useLayoutEffect(() => {
    if (motion !== 'live' || !items.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.tl-line i', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: 0.6 } });
      gsap.utils.toArray('.tl-item').forEach((el, i) => {
        gsap.from(el, { autoAlpha: 0, x: i % 2 ? 90 : -90, filter: 'blur(8px)', duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' } });
      });
    }, ref);
    return () => ctx.revert();
  }, [items.length, motion]);

  return (
    <section className="section" id="experience" ref={ref}>
      <header className="section-head">
        <p className="kicker">{t.experience.kicker}</p>
        <h2>{t.experience.title}</h2>
      </header>
      {!items.length && <p className="muted center">{t.experience.empty}</p>}
      <div className="timeline">
        <div className="tl-line"><i /></div>
        {items.map((x, i) => (
          <article key={i} className={`tl-item ${i % 2 ? 'right' : 'left'}`}>
            <span className="tl-dot" />
            <div className="tl-card">
              <span className="tl-period">{x.period}</span>
              <h3>{lang === 'es' ? x.role_es || x.role_en : x.role_en || x.role_es}</h3>
              {x.company && <p className="tl-company">{x.company}</p>}
              <p>{lang === 'es' ? x.desc_es || x.desc_en : x.desc_en || x.desc_es}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
