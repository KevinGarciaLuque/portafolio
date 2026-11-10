import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { useProfile } from '../profileContext.jsx';
import About from '../components/About.jsx';
import Experience from '../components/Experience.jsx';
import Education from '../components/Education.jsx';
import SceneSection from '../components/SceneSection.jsx';
import SocialLinks from '../components/SocialLinks.jsx';
import { ScrollTrigger, refreshScroll } from '../lib/motion.js';

export default function AboutPage() {
  const { t, lang, setLang } = useLang();
  const { profile } = useProfile();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${t.nav.about} · ${profile.name}`;
  }, [t.nav.about, profile.name]);

  // Recalcula el scroll cuando cambia la altura de la página (fuentes, imágenes, contenido dinámico)
  useEffect(() => {
    const ro = new ResizeObserver(() => refreshScroll(250));
    ro.observe(document.body);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    return () => { ro.disconnect(); window.removeEventListener('load', onLoad); };
  }, []);

  return (
    <>
      <div className="letterbox top" /><div className="letterbox bottom" />
      <div className="grain" aria-hidden="true" />
      <nav className="nav scrolled">
        <Link className="logo" to="/">{profile.name.split(' ')[0].toUpperCase()}<i>.</i></Link>
        <button className="burger" aria-label="Menú" aria-expanded={menu} onClick={() => setMenu(!menu)}><span /><span /><span /></button>
        <div className={`nav-links ${menu ? 'open' : ''}`}>
          <Link to="/">← {t.nav.home}</Link>
          <Link to="/#book">{t.nav.book}</Link>
          <Link to="/#contact">{t.nav.contact}</Link>
          <button className="lang" aria-label={lang === 'es' ? 'Switch to English' : 'Cambiar a español'} onClick={() => setLang(lang === 'es' ? 'en' : 'es')}>{lang === 'es' ? 'EN' : 'ES'}</button>
        </div>
      </nav>
      <main id="main" tabIndex={-1} style={{ paddingTop: 80 }}>
        <SceneSection variant="curtain" backdrop="about" hue={195}><About /></SceneSection>
        <SceneSection variant="rise" backdrop="experience" hue={215}><Experience /></SceneSection>
        <SceneSection variant="curtain"><Education /></SceneSection>
      </main>
      <footer className="footer">
        <SocialLinks className="footer-social" />
        © {new Date().getFullYear()} {profile.name} · {t.footer}
      </footer>
    </>
  );
}
