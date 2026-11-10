import { useLang } from '../i18n.jsx';
import { useProfile } from '../profileContext.jsx';

/** Botón «Descargar CV». No se dibuja si el admin no subió un CV o tiene la descarga desactivada. */
export default function CvButton({ className = 'btn ghost', children }) {
  const { t } = useLang();
  const { profile } = useProfile();
  if (!profile.cvAvailable) return null;
  return (
    <a className={className} href="/api/cv" download>
      <span aria-hidden="true">↓ </span>{children || t.cv.download}
    </a>
  );
}
