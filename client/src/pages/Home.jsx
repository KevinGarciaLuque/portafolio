import { useEffect, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { useProfile } from '../profileContext.jsx';
import Hero from '../components/Hero.jsx';
import Catalog from '../components/Catalog.jsx';
import About from '../components/About.jsx';
import Booking from '../components/Booking.jsx';
import Contact from '../components/Contact.jsx';
import Experience from '../components/Experience.jsx';
import SceneSection from '../components/SceneSection.jsx';
import SocialLinks, { WhatsAppFloat } from '../components/SocialLinks.jsx';
import { ScrollTrigger, refreshScroll } from '../lib/motion.js';

export default function Home() {
  const { t, lang, setLang } = useLang();
  const { profile } = useProfile();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  // Recalcula el scroll cuando cambia la altura de la página (fuentes, imágenes, contenido dinámico)
  useEffect(() => {
    const ro = new ResizeObserver(() => refreshScroll(250));
    ro.observe(document.body);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    return () => { ro.disconnect(); window.removeEventListener('load', onLoad); };
  }, []);

  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <div className="letterbox top" /><div className="letterbox bottom" />
      <div className="grain" aria-hidden="true" />
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <a className="logo" href="#top" onClick={(e) => { e.preventDefault(); go('top'); }}>{profile.name.split(' ')[0].toUpperCase()}<i>.</i></a>
        <div className="nav-links">
          <button onClick={() => go('catalog')}>{t.nav.catalog}</button>
          <button onClick={() => go('about')}>{t.nav.about}</button>
          <button onClick={() => go('experience')}>{t.nav.experience}</button>
          <button onClick={() => go('book')}>{t.nav.book}</button>
          <button onClick={() => go('contact')}>{t.nav.contact}</button>
          <button className="lang" onClick={() => setLang(lang === 'es' ? 'en' : 'es')}>{lang === 'es' ? 'EN' : 'ES'}</button>
        </div>
      </nav>
      <main>
        <Hero />
        <SceneSection variant="wipe" backdrop="projects" hue={205}><Catalog /></SceneSection>
        <SceneSection variant="curtain" backdrop="about" hue={195}><About /></SceneSection>
        <SceneSection variant="rise" backdrop="experience" hue={215}><Experience /></SceneSection>
        <SceneSection variant="zoom"><Booking /></SceneSection>
        <SceneSection variant="zoom" backdrop="contact" hue={185}><Contact /></SceneSection>
      </main>
      <WhatsAppFloat />
      <footer className="footer">
        <SocialLinks className="footer-social" />
        © {new Date().getFullYear()} {profile.name} · {t.footer}
      </footer>
    </>
  );
}
