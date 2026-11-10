import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { useProfile } from '../profileContext.jsx';
import About from '../components/About.jsx';
import Experience from '../components/Experience.jsx';
import Education from '../components/Education.jsx';
import SceneSection from '../components/SceneSection.jsx';
import SocialLinks, { WhatsAppFloat } from '../components/SocialLinks.jsx';
import { ScrollTrigger, refreshScroll } from '../lib/motion.js';

export default function AboutPage() {
  const { t, lang, setLang } = useLang();
  const { profile } = useProfile();

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
        <div className="nav-links">
          <Link to="/">← {t.nav.home}</Link>
          <Link to="/#book">{t.nav.book}</Link>
          <Link to="/#contact">{t.nav.contact}</Link>
          <button className="lang" onClick={() => setLang(lang === 'es' ? 'en' : 'es')}>{lang === 'es' ? 'EN' : 'ES'}</button>
        </div>
      </nav>
      <main style={{ paddingTop: 80 }}>
        <SceneSection variant="curtain" backdrop="about" hue={195}><About /></SceneSection>
        <SceneSection variant="rise" backdrop="experience" hue={215}><Experience /></SceneSection>
        <SceneSection variant="curtain"><Education /></SceneSection>
      </main>
      <WhatsAppFloat />
      <footer className="footer">
        <SocialLinks className="footer-social" />
        © {new Date().getFullYear()} {profile.name} · {t.footer}
      </footer>
    </>
  );
}
