import { useState } from 'react';
import { api } from '../api.js';
import { useLang } from '../i18n.jsx';
import { useProfile } from '../profileContext.jsx';
import SocialLinks, { digits } from './SocialLinks.jsx';

export default function Contact() {
  const { t } = useLang();
  const { profile } = useProfile();
  const wa = digits(profile.whatsapp);
  const tel = digits(profile.phone);
  const [f, setF] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [s, setS] = useState({ busy: false, msg: '', ok: false });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setS({ busy: true, msg: '', ok: false });
    try {
      await api('/contact', { method: 'POST', body: f });
      setS({ busy: false, msg: t.contact.ok, ok: true });
      setF({ name: '', email: '', subject: '', message: '', website: '' });
    } catch {
      setS({ busy: false, msg: t.contact.err, ok: false });
    }
  }

  return (
    <section className="section" id="contact">
      <header className="section-head">
        <p className="kicker">{t.contact.kicker}</p>
        <h2>{t.contact.title}</h2>
        <p className="sub">{t.contact.sub}</p>
      </header>
      <div className="direct">
        <h4>{t.contact.direct}</h4>
        <ul>
          {profile.phone && <li><span>☎</span> <a href={`tel:+${tel}`}>{profile.phone}</a></li>}
          {wa && <li><span>✆</span> <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">WhatsApp: {profile.whatsapp}</a></li>}
          {profile.email && <li><span>✉</span> <a href={`mailto:${profile.email}`}>{profile.email}</a></li>}
          {profile.location && <li><span>⌖</span> {profile.location}</li>}
        </ul>
        <SocialLinks />
      </div>
      <form className="form contact-form" onSubmit={submit}>
        <div className="row">
          <input required placeholder={t.contact.name} value={f.name} onChange={set('name')} maxLength={120} />
          <input required type="email" placeholder={t.contact.email} value={f.email} onChange={set('email')} maxLength={160} />
        </div>
        <input placeholder={t.contact.subject} value={f.subject} onChange={set('subject')} maxLength={200} />
        <textarea required rows={6} placeholder={t.contact.message} value={f.message} onChange={set('message')} maxLength={5000} />
        {/* honeypot: los humanos no lo ven */}
        <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} />
        <button className="btn primary" disabled={s.busy}>{s.busy ? t.contact.sending : t.contact.send}</button>
        {s.msg && <p className={s.ok ? 'ok' : 'err'}>{s.msg}</p>}
      </form>
    </section>
  );
}
