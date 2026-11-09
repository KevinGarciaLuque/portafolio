import { FaLinkedinIn, FaGithub, FaFacebookF, FaInstagram, FaTiktok, FaYoutube, FaXTwitter, FaWhatsapp, FaEnvelope } from 'react-icons/fa6';
import { useProfile } from '../profileContext.jsx';

const ICONS = {
  linkedin: [FaLinkedinIn, 'LinkedIn'], github: [FaGithub, 'GitHub'], facebook: [FaFacebookF, 'Facebook'],
  instagram: [FaInstagram, 'Instagram'], tiktok: [FaTiktok, 'TikTok'], youtube: [FaYoutube, 'YouTube'], x: [FaXTwitter, 'X'],
};

/** Solo permite enlaces http(s): evita esquemas peligrosos como javascript: */
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null);
export const digits = (n) => (n || '').replace(/[^\d]/g, '');

export default function SocialLinks({ className = '' }) {
  const { profile } = useProfile();
  const items = Object.entries(profile.social).filter(([, u]) => safeUrl(u));
  const wa = digits(profile.whatsapp);
  if (!items.length && !wa && !profile.email) return null;
  return (
    <ul className={`social ${className}`}>
      {wa && <li><a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp"><FaWhatsapp /></a></li>}
      {profile.email && <li><a href={`mailto:${profile.email}`} aria-label="Email" title="Email"><FaEnvelope /></a></li>}
      {items.map(([k, u]) => {
        const [Icon, label] = ICONS[k];
        return <li key={k}><a href={safeUrl(u)} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}><Icon /></a></li>;
      })}
    </ul>
  );
}

export function WhatsAppFloat() {
  const { profile } = useProfile();
  const wa = digits(profile.whatsapp);
  if (!wa) return null;
  return (
    <a className="wa-float" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
      <FaWhatsapp />
    </a>
  );
}
