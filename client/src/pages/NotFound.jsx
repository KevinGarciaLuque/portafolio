import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n.jsx';

export default function NotFound() {
  const { t } = useLang();
  useEffect(() => {
    document.title = `404 · ${t.notFound.title}`;
    // Que los buscadores no indexen rutas inexistentes
    const m = document.createElement('meta');
    m.name = 'robots'; m.content = 'noindex';
    document.head.appendChild(m);
    return () => m.remove();
  }, [t.notFound.title]);

  return (
    <main className="admin-login">
      <div style={{ textAlign: 'center', display: 'grid', gap: 14, justifyItems: 'center' }}>
        <p className="kicker">404</p>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 'clamp(48px, 10vw, 110px)', letterSpacing: 3, lineHeight: 1 }}>{t.notFound.title}</h1>
        <p className="muted">{t.notFound.text}</p>
        <Link className="btn primary" to="/">{t.notFound.back}</Link>
      </div>
    </main>
  );
}
