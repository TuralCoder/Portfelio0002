import { ArrowDown, MessageCircle } from 'lucide-react';
import { site, hero, contact } from '../content/siteContent';

export function Hero() {
  return (
    <section id="giris" className="hero" aria-labelledby="hero-heading">
      <div className="hero__inner">
        <div className="hero__content">
          <p className="hero__eyebrow">
            {site.title} · {site.location}
          </p>

          <h1 id="hero-heading" className="hero__headline">
            {hero.headline.map((line, i) => (
              <span key={i} className="hero__headline-line">
                {line}
              </span>
            ))}
          </h1>

          <p className="hero__description">{hero.description}</p>

          <div className="hero__actions">
            <a href={contact.whatsappUrl} className="btn btn--primary" target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} aria-hidden="true" />
              {hero.ctaPrimary.label}
            </a>
            <a href={hero.ctaSecondary.href} className="btn btn--secondary">
              {hero.ctaSecondary.label}
            </a>
          </div>
        </div>

        <div className="hero__aside" aria-hidden="true">
          <div className="hero__monogram-card">
            <span className="hero__monogram-large">{site.monogram}</span>
            <span className="hero__monogram-sub">{site.subtitle}</span>
          </div>
        </div>
      </div>

      <a href="#xidmetler" className="hero__scroll" aria-label="Aşağı sürüşdür">
        <ArrowDown size={20} aria-hidden="true" />
      </a>
    </section>
  );
}
