import { motion } from 'framer-motion';
import { useLang } from '../i18n.jsx';
import { useProfile } from '../profileContext.jsx';

// Solo se muestra si agregaste al menos un testimonio desde el panel (Perfil y contacto → Testimonios)
export default function Testimonials() {
  const { t, lang } = useLang();
  const { profile } = useProfile();
  const items = profile.testimonials.filter((x) => (x.text_es || x.text_en || '').trim());
  if (!items.length) return null;

  return (
    <section className="section" id="testimonials">
      <header className="section-head">
        <p className="kicker">{t.testimonials.kicker}</p>
        <h2>{t.testimonials.title}</h2>
      </header>
      <div className="testi-grid">
        {items.map((x, i) => (
          <motion.figure key={i} className="testi" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}>
            <blockquote>{lang === 'es' ? x.text_es || x.text_en : x.text_en || x.text_es}</blockquote>
            <figcaption><b>{x.name}</b>{x.role && <span>{x.role}</span>}</figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
