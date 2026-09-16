import type { ReactNode } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface SectionProps {
  id: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, title, subtitle, children, className = '' }: SectionProps) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section
      id={id}
      ref={ref}
      className={`section ${isVisible ? 'section--visible' : ''} ${className}`}
      aria-labelledby={title ? `${id}-heading` : undefined}
    >
      <div className="section__inner">
        {(title || subtitle) && (
          <header className="section__header">
            {title && (
              <h2 id={`${id}-heading`} className="section__title">
                {title}
              </h2>
            )}
            {subtitle && <p className="section__subtitle">{subtitle}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
