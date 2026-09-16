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

        <div className="hero__aside">
          <div className="hero__status">
            <span className="hero__status-dot" aria-hidden="true" />
            <p className="hero__status-label">{hero.availability}</p>
            <p className="hero__status-meta">
              {site.subtitle}
              <br />
              {site.location}
            </p>
          </div>
        </div>
      </div>

      <a href="#xidmetler" className="hero__scroll" aria-label="Aşağı sürüşdür">
        <ArrowDown size={20} aria-hidden="true" />
      </a>
    </section>
  );
}
