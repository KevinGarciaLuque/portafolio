import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLang } from '../i18n.jsx';
import { useProfile } from '../profileContext.jsx';
import SocialLinks from '../components/SocialLinks.jsx';
import NotFound from './NotFound.jsx';

export default function ProjectPage() {
  const { id } = useParams();
  const { t, lang, setLang } = useLang();
  const { profile } = useProfile();
  const [s, setS] = useState(undefined); // undefined = cargando, null = no existe

  useEffect(() => {
    setS(undefined);
    api(`/systems/${id}`).then(setS).catch(() => setS(null));
  }, [id]);

  const title = s ? (lang === 'es' ? s.title_es : s.title_en) || s.title_es : '';
  useEffect(() => { if (s) document.title = `${title} · ${profile.name}`; }, [s, title, profile.name]);

  if (s === null) return <NotFound />;
  const tags = (s?.tags || '').split(',').map((x) => x.trim()).filter(Boolean);

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <nav className="nav scrolled">
        <Link className="logo" to="/">{profile.name.split(' ')[0].toUpperCase()}<i>.</i></Link>
        <div className="proj-actions">
          <Link className="btn ghost" to="/#catalog">← {t.nav.catalog}</Link>
          <button className="btn ghost" aria-label={lang === 'es' ? 'Switch to English' : 'Cambiar a español'} onClick={() => setLang(lang === 'es' ? 'en' : 'es')}>{lang === 'es' ? 'EN' : 'ES'}</button>
        </div>
      </nav>
      <main id="main" tabIndex={-1} className="proj">
        {s === undefined ? <p className="muted center">{t.catalog.loading}</p> : (
          <article>
            <div className="proj-media">
              {s.video_url ? <video src={s.video_url} autoPlay muted loop playsInline poster={s.image_url || undefined} />
                : s.image_url ? <img src={s.image_url} alt={title} /> : <div className="card-placeholder" style={{ '--h': 20 }} />}
            </div>
            <div className="proj-body">
              <h1>{title}</h1>
              <p className="modal-tag">{lang === 'es' ? s.tagline_es : s.tagline_en}</p>
              <p className="proj-desc">{lang === 'es' ? s.desc_es : s.desc_en}</p>
              <div className="tags">{tags.map((x) => <span key={x}>{x}</span>)}</div>
              {s.url
                ? <a className="btn primary" href={s.url} target="_blank" rel="noopener noreferrer">{t.catalog.visit} ↗</a>
                : <button className="btn ghost" disabled>{t.catalog.soon}</button>}
            </div>
          </article>
        )}
      </main>
      <footer className="footer">
        <SocialLinks className="footer-social" />
        © {new Date().getFullYear()} {profile.name} · {t.footer}
      </footer>
    </>
  );
}
