import { MessageCircle } from 'lucide-react';
import { Section } from './Section';
import { services } from '../content/siteContent';

export function Services() {
  return (
    <Section id="xidmetler" title="Xidmətlər" subtitle="Biznesiniz üçün rəqəmsal həllər">
      <ul className="services-grid">
        {services.map((service) => (
          <li key={service.id} className="service-card">
            <h3 className="service-card__title">{service.title}</h3>
            <p className="service-card__desc">{service.description}</p>
            <a
              href={service.whatsappUrl}
              className="service-card__link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={16} aria-hidden="true" />
              WhatsApp-da soruş
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
