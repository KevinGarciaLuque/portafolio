import { motion } from 'framer-motion';
import { useLang } from '../i18n.jsx';
import { useProfile } from '../profileContext.jsx';

export default function Education() {
  const { t, lang } = useLang();
  const { profile } = useProfile();
  const items = profile.education;

  return (
    <section className="section" id="education">
      <header className="section-head">
        <p className="kicker">{t.education.kicker}</p>
        <h2>{t.education.title}</h2>
      </header>
      {!items.length && <p className="muted center">{t.education.empty}</p>}
      <div className="edu-grid">
        {items.map((x, i) => (
          <motion.article key={i} className="edu-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}>
            <span className="tl-period">{x.year}</span>
            <h3>{lang === 'es' ? x.title_es || x.title_en : x.title_en || x.title_es}</h3>
            {x.org && <p className="tl-company">{x.org}</p>}
          </motion.article>
        ))}
      </div>
    </section>
  );
}
