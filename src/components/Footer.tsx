import { site } from '../content/siteContent';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p>
          © {year} {site.name}. Bütün hüquqlar qorunur.
        </p>
      </div>
    </footer>
  );
}
