import { useState, useEffect, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { site, navItems } from '../content/siteContent';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, closeMenu]);

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="header__inner">
        <a href="#giris" className="header__brand" aria-label={`${site.name} — ana səhifə`}>
          <span className="header__monogram" aria-hidden="true">
            {site.monogram}
          </span>
          <span className="header__name">{site.name}</span>
        </a>

        <nav className="header__nav" aria-label="Əsas naviqasiya">
          <ul className="header__nav-list">
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="header__nav-link">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          <ThemeToggle />
          <button
            type="button"
            className="header__menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Menyunu bağla' : 'Menyunu aç'}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-menu"
        className={`header__mobile ${menuOpen ? 'header__mobile--open' : ''}`}
        aria-label="Mobil naviqasiya"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <ul className="header__mobile-list">
          {navItems.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="header__mobile-link" onClick={closeMenu}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
