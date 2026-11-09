import { createContext, useContext, useState, useEffect } from 'react';

const dict = {
  es: {
    nav: { catalog: 'Catálogo', about: 'Sobre mí', experience: 'Experiencia', book: 'Agendar', contact: 'Contacto' },
    hero: {
      kicker: 'Presenta',
      title1: 'SISTEMAS',
      title2: 'QUE TRABAJAN POR TI',
      sub: 'Software a la medida para que tu negocio funcione como una producción de cine: cada pieza en su lugar.',
      cta1: 'Ver catálogo',
      cta2: 'Agendar reunión',
      scroll: 'Desliza',
      role: 'Desarrollador de sistemas full-stack',
      b2kicker: 'Del concepto al código',
      b2title: 'DISEÑO · DESARROLLO · DESPLIEGUE',
      b2text: 'Base de datos, servidor e interfaz en un solo equipo de una persona: rápido, seguro y hecho a tu medida.',
      b3kicker: 'Tu turno',
      b3title: 'ENTRA AL CATÁLOGO',
    },
    catalog: {
      kicker: 'En cartelera',
      title: 'CATÁLOGO DE SISTEMAS',
      sub: 'Cada sistema es una producción propia. Haz clic para ver el detalle y entrar al sistema en vivo.',
      open: 'Ver detalles',
      visit: 'Entrar al sistema',
      soon: 'Próximamente',
      close: 'Cerrar',
      loading: 'Cargando catálogo…',
      empty: 'Aún no hay sistemas publicados.',
    },
    experience: { kicker: 'La trayectoria', title: 'EXPERIENCIA', empty: 'Pronto agregaré mi experiencia.' },
    about: {
      kicker: 'Detrás de cámaras',
      title: 'SOBRE MÍ',
      text: 'Diseño y desarrollo sistemas completos: base de datos, servidor e interfaz. Me enfoco en soluciones claras, rápidas y seguras que resuelven problemas reales de negocio.',
      stack: 'Tecnologías',
    },
    book: {
      kicker: 'Reserva tu función',
      title: 'AGENDA UNA REUNIÓN',
      sub: 'Elige un día y una hora. Me explicas qué sistema necesitas y lo planeamos juntos.',
      pickDay: 'Elige un día',
      pickTime: 'Horarios disponibles',
      noSlots: 'Sin horarios para este día.',
      name: 'Tu nombre',
      email: 'Tu correo',
      phone: 'Teléfono (opcional)',
      topic: 'Cuéntame brevemente qué sistema necesitas',
      send: 'Confirmar reunión',
      sending: 'Enviando…',
      ok: '¡Listo! Tu reunión quedó solicitada. Te confirmaré por correo.',
      taken: 'Ese horario acaba de ocuparse, elige otro.',
      selected: 'Reunión para',
      days: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    },
    contact: {
      kicker: 'Tu proyecto, mi próxima producción',
      title: 'CUÉNTAME TU PROYECTO',
      sub: 'Escríbeme y elaboro una propuesta a tu medida.',
      name: 'Nombre',
      email: 'Correo',
      subject: 'Asunto',
      message: 'Mensaje',
      send: 'Enviar mensaje',
      sending: 'Enviando…',
      ok: '¡Mensaje enviado! Te responderé muy pronto.',
      err: 'No se pudo enviar. Revisa los datos e intenta de nuevo.',
      direct: 'Contacto directo',
      call: 'Llamar',
      write: 'Escribir por WhatsApp',
      follow: 'Sígueme',
    },
    footer: 'Todos los derechos reservados.',
  },
  en: {
    nav: { catalog: 'Catalog', about: 'About', experience: 'Experience', book: 'Book', contact: 'Contact' },
    hero: {
      kicker: 'Presents',
      title1: 'SYSTEMS',
      title2: 'THAT WORK FOR YOU',
      sub: 'Custom software so your business runs like a film production: every piece in its place.',
      cta1: 'View catalog',
      cta2: 'Book a meeting',
      scroll: 'Scroll',
      role: 'Full-stack systems developer',
      b2kicker: 'From concept to code',
      b2title: 'DESIGN · DEVELOP · DEPLOY',
      b2text: 'Database, server and interface from a single one-person team: fast, secure and made to measure.',
      b3kicker: 'Your turn',
      b3title: 'ENTER THE CATALOG',
    },
    catalog: {
      kicker: 'Now showing',
      title: 'SYSTEMS CATALOG',
      sub: 'Each system is its own production. Click to see details and enter the live system.',
      open: 'View details',
      visit: 'Enter the system',
      soon: 'Coming soon',
      close: 'Close',
      loading: 'Loading catalog…',
      empty: 'No systems published yet.',
    },
    experience: { kicker: 'The journey', title: 'EXPERIENCE', empty: 'My experience will be added soon.' },
    about: {
      kicker: 'Behind the scenes',
      title: 'ABOUT ME',
      text: 'I design and build complete systems: database, server and interface. I focus on clear, fast and secure solutions that solve real business problems.',
      stack: 'Tech stack',
    },
    book: {
      kicker: 'Reserve your screening',
      title: 'BOOK A MEETING',
      sub: 'Pick a day and time. Tell me what system you need and we plan it together.',
      pickDay: 'Pick a day',
      pickTime: 'Available times',
      noSlots: 'No times available for this day.',
      name: 'Your name',
      email: 'Your email',
      phone: 'Phone (optional)',
      topic: 'Briefly tell me what system you need',
      send: 'Confirm meeting',
      sending: 'Sending…',
      ok: 'Done! Your meeting was requested. I will confirm by email.',
      taken: 'That time was just taken, please pick another.',
      selected: 'Meeting for',
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
    contact: {
      kicker: 'Your project, my next production',
      title: 'TELL ME ABOUT YOUR PROJECT',
      sub: 'Write to me and I will prepare a proposal tailored to you.',
      name: 'Name',
      email: 'Email',
      subject: 'Subject',
      message: 'Message',
      send: 'Send message',
      sending: 'Sending…',
      ok: 'Message sent! I will reply very soon.',
      err: 'Could not send. Check your data and try again.',
      direct: 'Direct contact',
      call: 'Call',
      write: 'Message on WhatsApp',
      follow: 'Follow me',
    },
    footer: 'All rights reserved.',
  },
};

const Ctx = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('lang') || (navigator.language.startsWith('en') ? 'en' : 'es'); }
    catch { return 'es'; }
  });
  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('lang', lang); } catch { /* sin almacenamiento */ }
  }, [lang]);
  return <Ctx.Provider value={{ lang, setLang, t: dict[lang] }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
