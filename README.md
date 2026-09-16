# Tural Daşdəmirov — personal portfolio

Azerbaijani-language portfolio for **Tural Daşdəmirov** (proqramçı və İT tərəfdaşı, Bakı). Built with React, TypeScript, and Vite. Copy and contact details live in `src/content/siteContent.ts`.

## Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build static files into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |

## Deploy

`npm run build` emits a static site in `dist/`. Upload that folder to any static host:

- [Cloudflare Pages](https://pages.cloudflare.com/), [Netlify](https://www.netlify.com/), or [Vercel](https://vercel.com/): build command `npm run build`, publish directory `dist`
- GitHub Pages: build, then publish `dist` (or use the GitHub Pages action)

After you have a public URL, set absolute `og:image` / `twitter:image` URLs in `index.html` (social crawlers often ignore relative image paths).

## Customize

- **Text, services, WhatsApp, email, phone:** `src/content/siteContent.ts`
- **SEO title, description, JSON-LD:** `index.html`
- **Colors / type:** `src/styles/variables.css`
- **3D background:** `src/components/BackgroundCanvas.tsx`

The tunnel animation starts on load. It stays paused when the visitor has `prefers-reduced-motion: reduce`. Anyone can still play or pause it with the control in the bottom-right corner.

## Browser support

Modern evergreen browsers. The background uses Canvas 2D (no WebGL). Hidden tabs and phones use a lower frame rate so the page stays responsive.
