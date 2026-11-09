import { useCallback } from 'react';
import { useLang } from '../i18n.jsx';
import { useProfile } from '../profileContext.jsx';
import ScrollSequence from './ScrollSequence.jsx';
import SocialLinks from './SocialLinks.jsx';
import Starfield from './Starfield.jsx';

const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export default function Hero() {
  const { t } = useLang();
  const { profile } = useProfile();

  // Línea de tiempo de los textos: se sincroniza con el mismo scroll que avanza los fotogramas (0 → 1)
  const setup = useCallback((tl, root) => {
    const q = (s) => root.querySelector(s);
    // Transiciones suaves: poco desplazamiento, desenfoque leve y fundidos largos que se solapan
    const out = { autoAlpha: 0, y: -24, filter: 'blur(3px)', ease: 'sine.inOut' };
    const into = { autoAlpha: 0, y: 24, filter: 'blur(3px)' };
    const shown = { autoAlpha: 1, y: 0, filter: 'blur(0px)', ease: 'sine.inOut' };
    tl.to(q('.scroll-hint'), { autoAlpha: 0, duration: 0.06 }, 0.02)
      .to(q('.seq-canvas'), { scale: 1.05, duration: 1 }, 0)
      .fromTo(q('.hero-progress i'), { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      .to(q('[data-beat="1"]'), { ...out, duration: 0.22 }, 0.1)
      .fromTo(q('[data-beat="2"]'), into, { ...shown, duration: 0.22 }, 0.3)
      .to(q('[data-beat="2"]'), { ...out, duration: 0.22 }, 0.54)
      .fromTo(q('[data-beat="3"]'), into, { ...shown, duration: 0.22 }, 0.72);
  }, []);

  return (
    <ScrollSequence name="hero" mode="pin" scroll="+=320%" hue={190} smooth={1.4} setup={setup} className="cine-hero" id="top">
      <Starfield />
      <div className="hero-beat" data-beat="1">
        <p className="kicker">{profile.name} · {t.hero.kicker}</p>
        <h1 className="hero-title">
          <span className="line">{t.hero.title1}</span>
          <span className="line accent">{t.hero.title2}</span>
        </h1>
        <p className="hero-sub">{t.hero.sub}</p>
        <div className="hero-cta">
          <button className="btn primary" onClick={() => go('catalog')}>{t.hero.cta1}</button>
          <button className="btn ghost" onClick={() => go('book')}>{t.hero.cta2}</button>
        </div>
        <p className="role">{t.hero.role}</p>
      </div>

      <div className="hero-beat" data-beat="2">
        <p className="kicker">{t.hero.b2kicker}</p>
        <h2 className="beat-title">{t.hero.b2title}</h2>
        <p className="hero-sub">{t.hero.b2text}</p>
      </div>

      <div className="hero-beat" data-beat="3">
        <p className="kicker">{t.hero.b3kicker}</p>
        <h2 className="beat-title accent">{t.hero.b3title}</h2>
        <div className="hero-cta">
          <button className="btn primary" onClick={() => go('catalog')}>{t.hero.cta1}</button>
          <button className="btn ghost" onClick={() => go('contact')}>{t.nav.contact}</button>
        </div>
        <SocialLinks className="hero-social" />
      </div>

      <div className="scroll-hint"><span>{t.hero.scroll}</span><i /></div>
      <div className="hero-progress" aria-hidden="true"><i /></div>
    </ScrollSequence>
  );
}
