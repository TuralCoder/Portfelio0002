import {
  Bot,
  Briefcase,
  Globe,
  Headset,
  LayoutDashboard,
  MessageCircle,
  Monitor,
  Smartphone,
  Sparkles,
  Table,
  type LucideIcon,
} from 'lucide-react';
import { Section } from './Section';
import { services } from '../content/siteContent';

const serviceIcons: Record<string, LucideIcon> = {
  web: Globe,
  panels: LayoutDashboard,
  erp: Briefcase,
  ai: Sparkles,
  bots: Bot,
  mobile: Smartphone,
  desktop: Monitor,
  excel: Table,
  support: Headset,
};

export function Services() {
  return (
    <Section id="xidmetler" title="Xidmətlər" subtitle="Biznesiniz üçün rəqəmsal həllər">
      <ul className="services-grid">
        {services.map((service, index) => {
          const Icon = serviceIcons[service.id] ?? Globe;
          return (
            <li key={service.id} className="service-card">
              <div className="service-card__top">
                <span className="service-card__icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="service-card__index">{String(index + 1).padStart(2, '0')}</span>
              </div>
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
          );
        })}
      </ul>
    </Section>
  );
}
