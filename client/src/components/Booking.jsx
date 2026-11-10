import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useLang } from '../i18n.jsx';

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function Booking() {
  const { t, lang } = useLang();
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [day, setDay] = useState(null);
  const [slots, setSlots] = useState(null);
  const [time, setTime] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', topic: '' });
  const [state, setState] = useState({ busy: false, msg: '', ok: false });

  useEffect(() => {
    if (!day) return;
    setSlots(null); setTime(null);
    api(`/slots?date=${day}`).then((r) => setSlots(r.slots)).catch(() => setSlots([]));
  }, [day]);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const n = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(first.getDay()).fill(null), ...Array.from({ length: n }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  }, [month]);

  const canPrev = month > new Date(today.getFullYear(), today.getMonth(), 1);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, msg: '', ok: false });
    try {
      await api('/meetings', { method: 'POST', body: { ...form, date: day, time } });
      setState({ busy: false, msg: t.book.ok, ok: true });
      setForm({ name: '', email: '', phone: '', topic: '' }); setTime(null);
      api(`/slots?date=${day}`).then((r) => setSlots(r.slots));
    } catch (err) {
      setState({ busy: false, ok: false, msg: err.status === 409 ? t.book.taken : t.contact.err });
      api(`/slots?date=${day}`).then((r) => setSlots(r.slots));
    }
  }

  return (
    <section className="section" id="book">
      <header className="section-head">
        <p className="kicker">{t.book.kicker}</p>
        <h2>{t.book.title}</h2>
        <p className="sub">{t.book.sub}</p>
      </header>

      <div className="booking">
        <div className="cal">
          <div className="cal-head">
            <button className="icon-btn" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Prev">‹</button>
            <strong>{month.toLocaleDateString(lang, { month: 'long', year: 'numeric' })}</strong>
            <button className="icon-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next">›</button>
          </div>
          <div className="cal-grid">
            {t.book.days.map((d) => <span key={d} className="dow">{d}</span>)}
            {cells.map((d, i) => d
              ? <button key={i} disabled={d < today} className={`day ${iso(d) === day ? 'sel' : ''} ${+d === +today ? 'today' : ''}`} onClick={() => { setDay(iso(d)); setState({ busy: false, msg: '', ok: false }); }}>{d.getDate()}</button>
              : <span key={i} />)}
          </div>
        </div>

        <div className="slots-panel">
          <h4>{day ? t.book.pickTime : t.book.pickDay}</h4>
          {day && slots === null && <p className="muted">…</p>}
          {day && slots?.length === 0 && <p className="muted">{t.book.noSlots}</p>}
          <div className="slots">
            {slots?.map((s) => <button key={s} className={`slot ${s === time ? 'sel' : ''}`} onClick={() => setTime(s)}>{s}</button>)}
          </div>

          {time && (
            <form onSubmit={submit} className="form">
              <p className="chosen">{t.book.selected} <b>{day} · {time}</b></p>
              <input required placeholder={t.book.name} aria-label={t.book.name} value={form.name} onChange={set('name')} maxLength={120} />
              <input required type="email" placeholder={t.book.email} aria-label={t.book.email} value={form.email} onChange={set('email')} maxLength={160} />
              <input placeholder={t.book.phone} aria-label={t.book.phone} value={form.phone} onChange={set('phone')} maxLength={40} />
              <textarea rows={3} placeholder={t.book.topic} aria-label={t.book.topic} value={form.topic} onChange={set('topic')} maxLength={3000} />
              <button className="btn primary" disabled={state.busy}>{state.busy ? t.book.sending : t.book.send}</button>
            </form>
          )}
          {state.msg && <p className={state.ok ? 'ok' : 'err'}>{state.msg}</p>}
        </div>
      </div>
    </section>
  );
}
