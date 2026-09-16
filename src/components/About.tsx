import { Section } from './Section';
import { about, site } from '../content/siteContent';

export function About() {
  return (
    <Section id="haqqimda" title="Haqqımda">
      <div className="about">
        <div className="about__monogram" aria-hidden="true">
          {site.monogram}
        </div>
        <div className="about__text">
          {about.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </Section>
  );
}
