import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useLang } from '../i18n.jsx';
import { profile } from '../profile.js';
import { useProfile } from '../profileContext.jsx';
import CvButton from './CvButton.jsx';

function Counter({ to, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - start) / 1600, 1);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{v}{suffix}</span>;
}

export default function About() {
  const { t, lang } = useLang();
  const { profile: me } = useProfile();
  return (
    <section className="section about" id="about">
      <header className="section-head">
        <p className="kicker">{t.about.kicker}</p>
        <h2>{t.about.title}</h2>
      </header>
      {me.photo && (
        <motion.img className="about-photo" src={me.photo} alt={me.name} loading="lazy"
          initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }} />
      )}
      <div className="about-roles">
        {[t.about.dev, t.about.qa].map((r) => (
          <motion.article key={r.role} className="about-role" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h3>{r.role}</h3>
            <p>{r.text}</p>
            <p className="kicker">{r.label}</p>
            <div className="tags">{r.tags.map((x) => <span key={x}>{x}</span>)}</div>
          </motion.article>
        ))}
      </div>
      <div className="about-cv"><CvButton className="btn primary" /></div>
      <div className="stats">
        {profile.stats.map((s) => (
          <div key={s.label.es} className="stat">
            <b><Counter to={s.n} suffix={s.suffix} /></b>
            <span>{s.label[lang]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
