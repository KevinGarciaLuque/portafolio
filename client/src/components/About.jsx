import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useLang } from '../i18n.jsx';
import { profile } from '../profile.js';

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
  return (
    <section className="section about" id="about">
      <header className="section-head">
        <p className="kicker">{t.about.kicker}</p>
        <h2>{t.about.title}</h2>
      </header>
      <motion.p className="about-text" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
        {t.about.text}
      </motion.p>
      <div className="stats">
        {profile.stats.map((s) => (
          <div key={s.label.es} className="stat">
            <b><Counter to={s.n} suffix={s.suffix} /></b>
            <span>{s.label[lang]}</span>
          </div>
        ))}
      </div>
      <p className="kicker center">{t.about.stack}</p>
      <div className="tags center-tags">{profile.stack.map((x) => <span key={x}>{x}</span>)}</div>
    </section>
  );
}
