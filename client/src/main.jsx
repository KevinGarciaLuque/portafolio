import { StrictMode, Suspense, lazy, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { WhatsAppFloat } from './components/SocialLinks.jsx';
import { LangProvider, useLang } from './i18n.jsx';
import { ProfileProvider } from './profileContext.jsx';
import { api } from './api.js';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
// El admin y las páginas secundarias se descargan solo cuando se visitan (el inicio pesa menos)
const Admin = lazy(() => import('./pages/Admin.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const ProjectPage = lazy(() => import('./pages/ProjectPage.jsx'));
import './styles.css';
import './cinema.css';

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
      <WhatsAppFloat />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <ProfileProvider>
      <BrowserRouter>
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
