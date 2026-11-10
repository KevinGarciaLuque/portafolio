import { StrictMode, Suspense, lazy, useEffect, useLayoutEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { WhatsAppFloat } from './components/SocialLinks.jsx';
import { LangProvider, useLang } from './i18n.jsx';
import { ProfileProvider } from './profileContext.jsx';
import { api } from './api.js';
import { refreshScroll } from './lib/motion.js';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
// El admin y las páginas secundarias se descargan solo cuando se visitan (el inicio pesa menos)
const Admin = lazy(() => import('./pages/Admin.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const ProjectPage = lazy(() => import('./pages/ProjectPage.jsx'));
import './styles.css';
import './cinema.css';

// Al cambiar de página siempre se empieza arriba. Se usa behavior 'instant' porque el CSS tiene
// scroll-behavior: smooth y una animación de regreso se interrumpía a medio camino mientras la página se armaba.
function ScrollManager() {
  const { pathname } = useLocation();
  useLayoutEffect(() => { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; }, []);
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // las animaciones por scroll recalculan sus posiciones cuando ya cambió el contenido
    refreshScroll(150);
    const t = setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }), 60);
    return () => clearTimeout(t);
  }, [pathname]);
  return null;
}

// Barra fina en el borde superior que muestra cuánto has avanzado en la página
function NavProgress() {
  const bar = useRef(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);
  return <div className="nav-progress" ref={bar} aria-hidden="true" />;
}

// Elementos comunes de las páginas públicas (no en el panel admin): enlace para saltar al contenido y botón de WhatsApp
function GlobalChrome() {
  const { pathname } = useLocation();
  const { t } = useLang();

  // Cuenta la visita una sola vez por página y por sesión (sin cookies; el servidor no guarda IP)
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    let first = true; // el origen (referrer) solo cuenta en la primera página de la sesión
    try {
      const key = `v:${pathname}`;
      if (sessionStorage.getItem(key)) return;
      first = !sessionStorage.getItem('v:any');
      sessionStorage.setItem(key, '1');
      sessionStorage.setItem('v:any', '1');
    } catch { /* sin almacenamiento: se cuenta igual */ }
    api('/track', { method: 'POST', body: { path: pathname, ref: first ? document.referrer : '' } }).catch(() => {});
  }, [pathname]);

  if (pathname.startsWith('/admin')) return null;
  return (
    <>
      <a className="skip-link" href="#main">{t.skip}</a>
      <NavProgress />
      <WhatsAppFloat />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <ProfileProvider>
      <BrowserRouter>
        <ScrollManager />
        <GlobalChrome />
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre-mi" element={<AboutPage />} />
          <Route path="/proyecto/:id" element={<ProjectPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </ProfileProvider>
    </LangProvider>
  </StrictMode>
);
