import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { useProfile } from '../profileContext.jsx';
import Hero from '../components/Hero.jsx';
import Catalog from '../components/Catalog.jsx';
import Booking from '../components/Booking.jsx';
import Contact from '../components/Contact.jsx';
import Testimonials from '../components/Testimonials.jsx';
import SceneSection from '../components/SceneSection.jsx';
import SocialLinks from '../components/SocialLinks.jsx';
import CvButton from '../components/CvButton.jsx';
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

  // Si se llega con un ancla (/#book desde otra página), baja a esa sección cuando la página ya cargó
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const tm = setTimeout(() => document.getElementById(id)?.scrollIntoView(), 600);
    return () => clearTimeout(tm);
  }, []);

  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState('');
  useEffect(() => {
    if (!menu) return;
    const k = (e) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [menu]);

  // Resalta en el menú la sección que está a la vista
  useEffect(() => {
    const ids = ['catalog', 'book', 'contact'];
    const seen = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id)));
      setActive(ids.find((i) => seen.has(i)) || '');
    }, { rootMargin: '-40% 0px -55% 0px' });
    const watch = () => ids.forEach((i) => { const el = document.getElementById(i); if (el) io.observe(el); });
    watch();
    const tm = setTimeout(watch, 1200); // por si alguna sección carga después
    return () => { io.disconnect(); clearTimeout(tm); };
  }, []);

  const go = (id) => { setMenu(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <>
      <div className="letterbox top" /><div className="letterbox bottom" />
      <div className="grain" aria-hidden="true" />
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <a className="logo" href="#top" onClick={(e) => { e.preventDefault(); go('top'); }}>{profile.name.split(' ')[0].toUpperCase()}<i>.</i></a>
        <button className="burger" aria-label="Menú" aria-expanded={menu} onClick={() => setMenu(!menu)}><span /><span /><span /></button>
        <div className={`nav-links ${menu ? 'open' : ''}`}>
          <button className={active === 'catalog' ? 'active' : ''} onClick={() => go('catalog')}>{t.nav.catalog}</button>
          <Link to="/sobre-mi">{t.nav.about}</Link>
          <button className={active === 'book' ? 'active' : ''} onClick={() => go('book')}>{t.nav.book}</button>
          <button className={active === 'contact' ? 'active' : ''} onClick={() => go('contact')}>{t.nav.contact}</button>
          <CvButton className="nav-cv" />
          <button className="lang" aria-label={lang === 'es' ? 'Switch to English' : 'Cambiar a español'} onClick={() => setLang(lang === 'es' ? 'en' : 'es')}>{lang === 'es' ? 'EN' : 'ES'}</button>
        </div>
      </nav>
      <main id="main" tabIndex={-1}>
        <Hero />
        <SceneSection variant="wipe" backdrop="projects" hue={205}><Catalog /></SceneSection>
        {profile.testimonials.some((x) => (x.text_es || x.text_en || '').trim()) && <SceneSection variant="curtain"><Testimonials /></SceneSection>}
        <SceneSection variant="zoom"><Booking /></SceneSection>
        <SceneSection variant="zoom" backdrop="contact" hue={185}><Contact /></SceneSection>
      </main>
      <footer className="footer">
        <SocialLinks className="footer-social" />
        © {new Date().getFullYear()} {profile.name} · {t.footer}
      </footer>
    </>
  );
}
