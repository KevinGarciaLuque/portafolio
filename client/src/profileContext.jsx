import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';
import { profile as fallback } from './profile.js';
import { refreshScroll } from './lib/motion.js';

const Ctx = createContext(null);

const parseList = (raw) => {
  try { const a = JSON.parse(raw || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
};

export function ProfileProvider({ children }) {
  const [data, setData] = useState({});
  useEffect(() => {
    api('/profile').then((d) => { setData(d); refreshScroll(); }).catch(() => {});
  }, []);

  const profile = {
    ...fallback,
    name: data.name || fallback.name,
    email: data.email || fallback.email,
    phone: data.phone || '',
    whatsapp: data.whatsapp || '',
    location: data.location || '',
    photo: data.photo || '',
    cvAvailable: data.cv_available === 'true', // el admin subió un CV y tiene la descarga activada
    social: Object.fromEntries(['linkedin', 'github', 'facebook', 'instagram', 'tiktok', 'youtube', 'x'].map((k) => [k, data[k] || ''])),
    experience: parseList(data.experience),
    education: parseList(data.education),
    testimonials: parseList(data.testimonials),
  };
  return <Ctx.Provider value={{ profile }}>{children}</Ctx.Provider>;
}

export const useProfile = () => useContext(Ctx);
