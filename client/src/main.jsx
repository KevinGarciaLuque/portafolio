import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { WhatsAppFloat } from './components/SocialLinks.jsx';
import { LangProvider } from './i18n.jsx';
import { ProfileProvider } from './profileContext.jsx';
import Home from './pages/Home.jsx';
import Admin from './pages/Admin.jsx';
import AboutPage from './pages/AboutPage.jsx';
import NotFound from './pages/NotFound.jsx';
import './styles.css';
import './cinema.css';

// Botón flotante de WhatsApp en todas las páginas públicas (no en el panel admin)
function GlobalWhatsApp() {
  const { pathname } = useLocation();
  return pathname.startsWith('/admin') ? null : <WhatsAppFloat />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <ProfileProvider>
      <BrowserRouter>
        <GlobalWhatsApp />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre-mi" element={<AboutPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </ProfileProvider>
    </LangProvider>
  </StrictMode>
);
