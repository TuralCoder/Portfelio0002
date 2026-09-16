import { Mail, MessageCircle, MapPin, Phone } from 'lucide-react';
import { Section } from './Section';
import { contact, site } from '../content/siteContent';

export function Contact() {
  return (
    <Section id="elaqe" className="contact-section">
      <div className="contact">
        <h2 className="contact__headline">{contact.headline}</h2>
        <p className="contact__desc">{contact.description}</p>

        <div className="contact__actions">
          <a
            href={contact.whatsappUrl}
            className="btn btn--primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={18} aria-hidden="true" />
            {contact.whatsappLabel}
          </a>
          <a href={site.mailtoUrl} className="btn btn--secondary">
            <Mail size={18} aria-hidden="true" />
            {contact.emailLabel}
          </a>
        </div>

        <ul className="contact__info">
          <li>
            <Mail size={16} aria-hidden="true" />
            <a href={site.mailtoUrl}>{site.email}</a>
          </li>
          <li>
            <Phone size={16} aria-hidden="true" />
            <a href={site.telUrl}>{site.phone}</a>
          </li>
          <li>
            <MessageCircle size={16} aria-hidden="true" />
            <a href={site.whatsappUrl} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </li>
          <li>
            <MapPin size={16} aria-hidden="true" />
            <span>{site.location}</span>
          </li>
        </ul>
      </div>
    </Section>
  );
}
