import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../api.js';

const TABS = [
  ['dash', 'Resumen'], ['systems', 'Sistemas'], ['messages', 'Mensajes'],
  ['meetings', 'Reuniones'], ['avail', 'Disponibilidad'], ['profile', 'Perfil y contacto'], ['account', 'Cuenta'],
];
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function Login({ onOk }) {
  const [f, setF] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      const r = await api('/admin/login', { method: 'POST', body: f });
      setToken(r.token); onOk();
    } catch (x) { setErr(x.message); }
  }
  return (
    <div className="admin-login">
      <form className="form" onSubmit={submit}>
        <h2>Panel administrativo</h2>
        <input placeholder="Usuario" autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        <input type="password" placeholder="Clave" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <button className="btn primary">Entrar</button>
        {err && <p className="err">{err}</p>}
      </form>
    </div>
  );
}

function Dash() {
  const [s, setS] = useState(null);
  useEffect(() => { api('/admin/stats', { auth: true }).then(setS); }, []);
  if (!s) return <p className="muted">Cargando…</p>;
  const items = [['Sistemas', s.systems], ['Mensajes sin leer', s.unread], ['Reuniones pendientes', s.pending], ['Próximas reuniones', s.upcoming]];
  return <div className="stats">{items.map(([l, n]) => <div className="stat" key={l}><b>{n}</b><span>{l}</span></div>)}</div>;
}

const EMPTY = { title_es: '', title_en: '', tagline_es: '', tagline_en: '', desc_es: '', desc_en: '', url: '', image_url: '', video_url: '', tags: '', sort_order: 0, visible: 1 };

function SystemForm({ initial, onDone, onCancel }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function up(k, file) {
    if (!file) return;
    const form = new FormData(); form.append('file', file);
    setBusy(true); setErr('');
    try { const r = await api('/admin/upload', { method: 'POST', auth: true, form }); setF((p) => ({ ...p, [k]: r.url })); }
    catch (x) { setErr(x.message); }
    setBusy(false);
  }
  async function save(e) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      if (f.id) await api(`/admin/systems/${f.id}`, { method: 'PUT', auth: true, body: f });
      else await api('/admin/systems', { method: 'POST', auth: true, body: f });
      onDone();
    } catch (x) { setErr(x.message); setBusy(false); }
  }
  return (
    <form className="form panel" onSubmit={save}>
      <div className="row"><input required placeholder="Título (ES)" value={f.title_es} onChange={set('title_es')} /><input placeholder="Title (EN)" value={f.title_en} onChange={set('title_en')} /></div>
      <div className="row"><input placeholder="Eslogan (ES)" value={f.tagline_es} onChange={set('tagline_es')} /><input placeholder="Tagline (EN)" value={f.tagline_en} onChange={set('tagline_en')} /></div>
      <div className="row"><textarea rows={3} placeholder="Descripción (ES)" value={f.desc_es} onChange={set('desc_es')} /><textarea rows={3} placeholder="Description (EN)" value={f.desc_en} onChange={set('desc_en')} /></div>
      <input placeholder="Link del sistema (https://…)" value={f.url} onChange={set('url')} />
      <input placeholder="Tecnologías separadas por coma" value={f.tags} onChange={set('tags')} />
      <div className="row">
        <label className="file">Imagen de vista previa<input type="file" accept="image/*" onChange={(e) => up('image_url', e.target.files[0])} /><small>{f.image_url}</small></label>
        <label className="file">Video corto (tráiler)<input type="file" accept="video/mp4,video/webm" onChange={(e) => up('video_url', e.target.files[0])} /><small>{f.video_url}</small></label>
      </div>
      <div className="row">
        <label>Orden <input type="number" value={f.sort_order} onChange={set('sort_order')} /></label>
        <label className="check"><input type="checkbox" checked={!!f.visible} onChange={(e) => setF({ ...f, visible: e.target.checked ? 1 : 0 })} /> Visible en el sitio</label>
      </div>
      <div className="row">
        <button className="btn primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>
      </div>
      {err && <p className="err">{err}</p>}
    </form>
  );
}

function Systems() {
  const [list, setList] = useState([]);
  const [edit, setEdit] = useState(null);
  const load = useCallback(() => api('/admin/systems', { auth: true }).then(setList), []);
  useEffect(() => { load(); }, [load]);
  const del = async (s) => { if (confirm(`¿Eliminar "${s.title_es}"?`)) { await api(`/admin/systems/${s.id}`, { method: 'DELETE', auth: true }); load(); } };
  if (edit) return <SystemForm initial={edit} onDone={() => { setEdit(null); load(); }} onCancel={() => setEdit(null)} />;
  return (
    <>
      <button className="btn primary" onClick={() => setEdit({ ...EMPTY, sort_order: list.length + 1 })}>+ Nuevo sistema</button>
      <table className="table">
        <thead><tr><th>#</th><th>Título</th><th>Link</th><th>Visible</th><th /></tr></thead>
        <tbody>{list.map((s) => (
          <tr key={s.id}>
            <td>{s.sort_order}</td><td>{s.title_es}</td>
            <td className="trunc">{s.url || <em className="muted">sin link</em>}</td>
            <td>{s.visible ? '✓' : '—'}</td>
            <td className="actions"><button onClick={() => setEdit(s)}>Editar</button><button className="danger" onClick={() => del(s)}>Eliminar</button></td>
          </tr>))}
        </tbody>
      </table>
    </>
  );
}

function Messages() {
  const [list, setList] = useState([]);
  const load = useCallback(() => api('/admin/messages', { auth: true }).then(setList), []);
  useEffect(() => { load(); }, [load]);
  const toggle = async (m) => { await api(`/admin/messages/${m.id}`, { method: 'PATCH', auth: true, body: { is_read: !m.is_read } }); load(); };
  const del = async (m) => { if (confirm('¿Eliminar mensaje?')) { await api(`/admin/messages/${m.id}`, { method: 'DELETE', auth: true }); load(); } };
  if (!list.length) return <p className="muted">No hay mensajes.</p>;
  return list.map((m) => (
    <div key={m.id} className={`panel msg ${m.is_read ? '' : 'unread'}`}>
      <div className="msg-head"><b>{m.name}</b> <a href={`mailto:${m.email}`}>{m.email}</a> <span className="muted">{m.created_at}</span></div>
      {m.subject && <p><b>{m.subject}</b></p>}
      <p className="pre">{m.message}</p>
      <div className="actions"><button onClick={() => toggle(m)}>{m.is_read ? 'Marcar sin leer' : 'Marcar leído'}</button><button className="danger" onClick={() => del(m)}>Eliminar</button></div>
    </div>
  ));
}

function Meetings() {
  const [list, setList] = useState([]);
  const load = useCallback(() => api('/admin/meetings', { auth: true }).then(setList), []);
  useEffect(() => { load(); }, [load]);
  const set = async (m, status) => { await api(`/admin/meetings/${m.id}`, { method: 'PATCH', auth: true, body: { status } }); load(); };
  if (!list.length) return <p className="muted">No hay reuniones.</p>;
  return list.map((m) => (
    <div key={m.id} className={`panel msg status-${m.status}`}>
      <div className="msg-head"><b>{m.start_at.slice(0, 16)}</b> · {m.name} · <a href={`mailto:${m.email}`}>{m.email}</a> {m.phone && `· ${m.phone}`} <span className={`badge ${m.status}`}>{m.status}</span></div>
      {m.topic && <p className="pre">{m.topic}</p>}
      <div className="actions">
        {m.status !== 'confirmed' && <button onClick={() => set(m, 'confirmed')}>Confirmar</button>}
        {m.status !== 'cancelled' && <button className="danger" onClick={() => set(m, 'cancelled')}>Cancelar</button>}
        {m.status === 'cancelled' && <button onClick={() => set(m, 'pending')}>Reactivar</button>}
      </div>
    </div>
  ));
}

function Availability() {
  const [rules, setRules] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [day, setDay] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => { api('/admin/availability', { auth: true }).then((r) => { setRules(r.rules); setBlocked(r.blocked); }); }, []);
  const upd = (i, k, v) => setRules(rules.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  async function save() {
    await api('/admin/availability', { method: 'PUT', auth: true, body: { rules, blocked } });
    setMsg('Guardado ✓'); setTimeout(() => setMsg(''), 2500);
  }
  return (
    <div className="panel">
      <h4>Horario semanal (bloques de 1 hora)</h4>
      {rules.map((r, i) => (
        <div className="row rule" key={i}>
          <select value={r.weekday} onChange={(e) => upd(i, 'weekday', Number(e.target.value))}>{DAYS.map((d, n) => <option key={n} value={n}>{d}</option>)}</select>
          <input type="time" value={r.start_time} onChange={(e) => upd(i, 'start_time', e.target.value)} />
          <input type="time" value={r.end_time} onChange={(e) => upd(i, 'end_time', e.target.value)} />
          <label className="check"><input type="checkbox" checked={!!r.active} onChange={(e) => upd(i, 'active', e.target.checked)} /> Activo</label>
          <button className="danger" onClick={() => setRules(rules.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button className="btn ghost" onClick={() => setRules([...rules, { weekday: 1, start_time: '09:00', end_time: '17:00', active: 1 }])}>+ Agregar bloque</button>
      <h4>Días bloqueados (vacaciones, feriados)</h4>
      <div className="row"><input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        <button className="btn ghost" onClick={() => day && !blocked.includes(day) && (setBlocked([...blocked, day].sort()), setDay(''))}>Bloquear</button></div>
      <div className="tags">{blocked.map((d) => <span key={d}>{d} <button className="x" onClick={() => setBlocked(blocked.filter((x) => x !== d))}>×</button></span>)}</div>
      <button className="btn primary" onClick={save}>Guardar disponibilidad</button> <span className="ok">{msg}</span>
    </div>
  );
}

const CONTACT_FIELDS = [
  ['name', 'Nombre', 'Kevin García'], ['email', 'Correo público', 'tucorreo@dominio.com'],
  ['phone', 'Teléfono', '+502 5555 5555'], ['whatsapp', 'WhatsApp (con código de país)', '+502 5555 5555'],
  ['location', 'Ubicación', 'Ciudad, País'],
];
const SOCIAL_FIELDS = [
  ['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['facebook', 'Facebook'], ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['x', 'X (Twitter)'],
];
const EXP_EMPTY = { role_es: '', role_en: '', company: '', period: '', desc_es: '', desc_en: '' };

function Profile() {
  const [f, setF] = useState(null);
  const [exp, setExp] = useState([]);
  const [m, setM] = useState({ t: '', ok: false });
  useEffect(() => {
    api('/admin/settings', { auth: true }).then((d) => {
      setF(d);
      try { setExp(JSON.parse(d.experience || '[]')); } catch { setExp([]); }
    });
  }, []);
  if (!f) return <p className="muted">Cargando…</p>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const updExp = (i, k, v) => setExp(exp.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const move = (i, d) => { const a = [...exp]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setExp(a); };

  async function save(e) {
    e.preventDefault();
    try {
      await api('/admin/settings', { method: 'PUT', auth: true, body: { ...f, experience: JSON.stringify(exp) } });
      setM({ t: 'Guardado ✓ (recarga la página pública para verlo)', ok: true });
    } catch (x) { setM({ t: x.message, ok: false }); }
  }
  return (
    <form className="form" onSubmit={save}>
      <div className="panel">
        <h4>Contacto</h4>
        {CONTACT_FIELDS.map(([k, l, ph]) => <label key={k} className="file">{l}<input value={f[k] || ''} placeholder={ph} onChange={set(k)} /></label>)}
      </div>
      <div className="panel">
        <h4>Redes sociales (enlaces completos, https://…)</h4>
        <p className="muted">Las que dejes vacías no se muestran en la página.</p>
        {SOCIAL_FIELDS.map(([k, l]) => <label key={k} className="file">{l}<input type="url" value={f[k] || ''} placeholder={`https://${k}.com/tu-usuario`} onChange={set(k)} /></label>)}
      </div>
      <div className="panel">
        <h4>Experiencia</h4>
        {exp.map((x, i) => (
          <div key={i} className="panel exp-edit">
            <div className="row"><input placeholder="Puesto (ES)" value={x.role_es} onChange={(e) => updExp(i, 'role_es', e.target.value)} /><input placeholder="Role (EN)" value={x.role_en} onChange={(e) => updExp(i, 'role_en', e.target.value)} /></div>
            <div className="row"><input placeholder="Empresa / cliente" value={x.company} onChange={(e) => updExp(i, 'company', e.target.value)} /><input placeholder="Periodo (2022 — Actual)" value={x.period} onChange={(e) => updExp(i, 'period', e.target.value)} /></div>
            <div className="row"><textarea rows={3} placeholder="Descripción (ES)" value={x.desc_es} onChange={(e) => updExp(i, 'desc_es', e.target.value)} /><textarea rows={3} placeholder="Description (EN)" value={x.desc_en} onChange={(e) => updExp(i, 'desc_en', e.target.value)} /></div>
            <div className="actions">
              <button type="button" onClick={() => move(i, -1)}>↑</button><button type="button" onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="danger" onClick={() => setExp(exp.filter((_, j) => j !== i))}>Eliminar</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={() => setExp([...exp, { ...EXP_EMPTY }])}>+ Agregar experiencia</button>
      </div>
      <div><button className="btn primary">Guardar perfil</button></div>
      {m.t && <p className={m.ok ? 'ok' : 'err'}>{m.t}</p>}
    </form>
  );
}

function Account() {
  const [f, setF] = useState({ current: '', next: '' });
  const [m, setM] = useState({ t: '', ok: false });
  async function submit(e) {
    e.preventDefault();
    try { await api('/admin/password', { method: 'POST', auth: true, body: f }); setM({ t: 'Clave actualizada ✓', ok: true }); setF({ current: '', next: '' }); }
    catch (x) { setM({ t: x.message, ok: false }); }
  }
  return (
    <form className="form panel" onSubmit={submit}>
      <h4>Cambiar clave</h4>
      <input type="password" placeholder="Clave actual" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} />
      <input type="password" placeholder="Nueva clave (mín. 10 caracteres)" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} />
      <button className="btn primary">Actualizar</button>
      {m.t && <p className={m.ok ? 'ok' : 'err'}>{m.t}</p>}
    </form>
  );
}

export default function Admin() {
  const [logged, setLogged] = useState(!!getToken());
  const [tab, setTab] = useState('dash');
  if (!logged) return <Login onOk={() => setLogged(true)} />;
  const View = { dash: Dash, systems: Systems, messages: Messages, meetings: Meetings, avail: Availability, profile: Profile, account: Account }[tab];
  return (
    <div className="admin">
      <aside>
        <a className="logo" href="/">KEVIN<i>.</i></a>
        {TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
        <button className="out" onClick={() => { setToken(null); setLogged(false); }}>Salir</button>
      </aside>
      <section className="admin-main"><h2>{TABS.find((t) => t[0] === tab)[1]}</h2><View /></section>
    </div>
  );
}
