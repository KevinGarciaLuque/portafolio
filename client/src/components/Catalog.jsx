import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api.js';
import { refreshScroll } from '../lib/motion.js';
import { useLang } from '../i18n.jsx';

const pad = (n) => String(n).padStart(2, '0');

function Card({ s, i, onOpen }) {
  const { lang, t } = useLang();
  const ref = useRef(null);
  const vid = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 10, y: ((e.clientY - r.top) / r.height - 0.5) * -10 });
  };
  const enter = () => vid.current?.play().catch(() => {});
  const leave = () => { setTilt({ x: 0, y: 0 }); if (vid.current) { vid.current.pause(); vid.current.currentTime = 0; } };

  return (
    <motion.article
      ref={ref}
      className="card"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: (i % 3) * 0.1 }}
      style={{ transform: `perspective(900px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)` }}
      onMouseMove={move} onMouseEnter={enter} onMouseLeave={leave}
      onClick={() => onOpen(s)}
      tabIndex={0}
      role="button"
      aria-haspopup="dialog"
      aria-label={`${t.catalog.open}: ${lang === 'es' ? s.title_es : s.title_en}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(s); } }}
    >
      <div className="card-media">
        {s.image_url ? <img src={s.image_url} alt="" loading="lazy" decoding="async" /> : <div className="card-placeholder" style={{ '--h': (i * 37) % 60 }} />}
        {s.video_url && <video ref={vid} src={s.video_url} muted loop playsInline preload="none" />}
        <span className="card-num">{pad(i + 1)}</span>
        <div className="card-shade" />
      </div>
      <div className="card-body">
        <h3>{lang === 'es' ? s.title_es : s.title_en}</h3>
        <p>{lang === 'es' ? s.tagline_es : s.tagline_en}</p>
        <span className="card-more">{t.catalog.open} →</span>
      </div>
    </motion.article>
  );
}

function Modal({ s, onClose }) {
  const { lang, t } = useLang();
  const dlg = useRef(null);
  useEffect(() => {
    const prev = document.activeElement; // para devolver el foco a la tarjeta al cerrar
    const k = (e) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab' || !dlg.current) return;
      // atrapa el foco dentro del diálogo
      const f = [...dlg.current.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    dlg.current?.querySelector('.modal-x')?.focus();
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [onClose]);
  const tags = (s.tags || '').split(',').map((x) => x.trim()).filter(Boolean);

  return (
    <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div ref={dlg} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"
        initial={{ scale: 0.92, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 220 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label={t.catalog.close}>×</button>
        <div className="modal-media">
          {s.video_url ? <video src={s.video_url} autoPlay muted loop playsInline poster={s.image_url || undefined} />
            : s.image_url ? <img src={s.image_url} alt="" /> : <div className="card-placeholder" style={{ '--h': 20 }} />}
          <div className="card-shade" />
        </div>
        <div className="modal-body">
          <h3 id="modal-title">{lang === 'es' ? s.title_es : s.title_en}</h3>
          <p className="modal-tag">{lang === 'es' ? s.tagline_es : s.tagline_en}</p>
          <p>{lang === 'es' ? s.desc_es : s.desc_en}</p>
          <div className="tags">{tags.map((x) => <span key={x}>{x}</span>)}</div>
          <div className="modal-actions">
            {s.url
              ? <a className="btn primary" href={s.url} target="_blank" rel="noopener noreferrer">{t.catalog.visit} ↗</a>
              : <button className="btn ghost" disabled>{t.catalog.soon}</button>}
            <Link className="btn ghost" to={`/proyecto/${s.id}`} onClick={onClose}>{t.catalog.page}</Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Catalog() {
  const { t } = useLang();
  const [systems, setSystems] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => { api('/systems').then((d) => { setSystems(d); refreshScroll(300); }).catch(() => setSystems([])); }, []);

  return (
    <section className="section" id="catalog">
      <header className="section-head">
        <p className="kicker">{t.catalog.kicker}</p>
        <h2>{t.catalog.title}</h2>
        <p className="sub">{t.catalog.sub}</p>
      </header>
      {systems === null && <p className="muted center">{t.catalog.loading}</p>}
      {systems?.length === 0 && <p className="muted center">{t.catalog.empty}</p>}
      <div className="cards">
        {systems?.map((s, i) => <Card key={s.id} s={s} i={i} onOpen={setOpen} />)}
      </div>
      {createPortal(
        <AnimatePresence>{open && <Modal s={open} onClose={() => setOpen(null)} />}</AnimatePresence>,
        document.body
      )}
    </section>
  );
}
