import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LangProvider } from './i18n.jsx';
import { ProfileProvider } from './profileContext.jsx';
import Home from './pages/Home.jsx';
import Admin from './pages/Admin.jsx';
import AboutPage from './pages/AboutPage.jsx';
import './styles.css';
import './cinema.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <ProfileProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre-mi" element={<AboutPage />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
      </ProfileProvider>
    </LangProvider>
  </StrictMode>
);
