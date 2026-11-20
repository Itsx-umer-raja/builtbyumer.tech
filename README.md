# BuiltByUmer — builtbyumer.tech

**Every tool you need. One destination.**

A free, international online tools platform: PDF conversion, image processing, QR codes,
network information, developer utilities, text processing, calculators, data and business
tools — all running **locally in your browser**. No accounts. No uploads.

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4**.

---

## The three creative experiences

| Experience | Route | What it is |
|---|---|---|
| **Fernhollow** | `/` (hero) | Cinematic landing hero with the real valley MP4 as the background and a 2D-canvas particle atmosphere. The authorised Three.js valley engine is **not** bundled — if its source chunks and assets are ever supplied, it can be integrated per the original bootstrap. |
| **Mossline** | `/` (scroll story) | A 640vh scroll-driven story: scroll-scrubbed fly-in video, fog, floating islands, progressive text, lime hotspots, a live tool-count glass card and tilting solution cards. |
| **Leon Vasari** | `/portfolio` | A horizontally scrolling 3D VHS shelf built from the supplied artwork sheets with exact crop coordinates, custom cursor, spring physics, keyboard/drag/wheel navigation and a Web-Animations-API detail view. |

The **actual product** is the tools platform behind them:

| Category | Route | Tools |
|---|---|---|
| PDF Tools | `/pdf-tools` | 24 |
| Image Tools | `/image-tools` | 22 |
| QR & Barcode | `/qr-tools` | 11 |
| Network Tools | `/network-tools` | 14 |
| Developer Tools | `/developer-tools` | 26 |
| Text Tools | `/text-tools` | 15 |
| Calculators | `/calculators` | 17 |
| Data Tools | `/data-tools` | 6 |
| Business Tools | `/business-tools` | 4 |
| Productivity | `/productivity-tools` | 6 |

Every tool has its own static, indexable route (e.g. `/pdf-tools/merge-pdf`) generated from
the central registry in `src/data/tools.ts`. Each tool implementation lives in
`src/components/tools/registry-<category>.tsx`.

---

## Running the project locally

Requirements: **Node.js 20+** and npm.

```bash
npm install      # install dependencies
npm run dev      # start the dev server → http://localhost:3000
npm run build    # production build (179 static pages)
npm start        # serve the production build
npm run lint     # ESLint
```

Type checking alone: `npx tsc --noEmit`.

> One-time asset note: the media in `public/videos`, `public/images` and `public/portfolio`
> was downloaded from the supplied CDN links via `node scripts/download-assets.cjs` and is
> committed to the repository so the site never depends on temporary remote URLs.

---

## Deploying to GitHub + Vercel

### 1. Create the GitHub repository

```bash
git init
git add .
git commit -m "BuiltByUmer — initial release"
git branch -M main
git remote add origin https://github.com/<your-username>/builtbyumer.git
git push -u origin main
```

### 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the `builtbyumer` repository.
2. Framework preset: **Next.js** (auto-detected). Build command `next build` — no overrides
   needed.
3. Click **Deploy**. Every push to `main` deploys production automatically; other branches
   get preview deployments.

### 3. Connect the custom domains

1. In the Vercel project → **Settings → Domains**, add `builtbyumer.tech` and
   `www.builtbyumer.tech`.
2. Vercel shows you the **exact DNS records required** (an `A` record or a `CNAME` to
   `cname.vercel-dns.com`, depending on the zone setup — use the values Vercel displays at
   that moment, do not copy records from elsewhere).
3. Set the non-canonical host to redirect to your preferred canonical domain in the domain
   settings.
4. HTTPS certificates are issued automatically by Vercel. Verify after DNS propagates
   (minutes to 48 h).

References:
- Vercel for GitHub: https://vercel.com/docs/git/vercel-for-github
- Custom domains: https://vercel.com/docs/domains/set-up-custom-domain

### 4. Environment variables

No environment variables are required — the site has no server secrets. If you later add
Analytics/AdSense, store any IDs in Vercel **Settings → Environment Variables** and mirror
them in `.env.example` (never commit real secrets).

---

## Hosting costs & limits (read before monetising)

- **Vercel Hobby is non-commercial.** The project intends to carry advertising revenue in the
  future, so commercial use requires a Vercel plan that permits it (see
  https://vercel.com/docs/plans/hobby and https://vercel.com/legal/terms).
- Until upgraded: `ADS_ENABLED = false` (`src/data/site.ts`), and the ad slot component
  renders nothing. No fake advertisements are shown at any point.
- Hobby bandwidth limits apply; the heaviest assets (videos ≈ 16 MB total) are served from
  `/public` and should move to a CDN object store if traffic grows.

## Advertising readiness

`src/components/advertisements/AdSlot.tsx` defines reusable slots (homepage sections,
category intros, tool instructions). Placements deliberately avoid sitting next to upload,
process or download controls. Enable only after AdSense approval **and** an eligible hosting
plan.

---

## Architecture

```text
src/
├── app/                    # routes (home, tools, [category], [category]/[tool], portfolio, legal…)
│   ├── page.tsx            # Fernhollow hero + Mossline story
│   ├── [category]/         # category listing + dynamic tool pages (SSG from the registry)
│   ├── portfolio/          # VHS shelf experience
│   ├── sitemap.ts robots.ts
│   └── …legal & info pages
├── components/
│   ├── fernhollow/         # hero + particle atmosphere
│   ├── mossline/           # scroll story
│   ├── portfolio/          # 3D shelf, cursor, detail overlay
│   ├── layout/             # header/footer
│   ├── advertisements/     # AdSlot (disabled)
│   └── tools/              # ui.tsx primitives, ToolSearch, registry-*.tsx per category
├── data/                   # site.ts, categories.ts, tools.ts (registry), portfolio.ts
├── lib/                    # utils + per-domain processing helpers (pdf/, images/, data/…)
└── app/globals.css         # Tailwind v4 theme + brand tokens
```

### Adding a tool

1. Add an entry to `src/data/tools.ts` (`id`, `category`, `title`, `description`).
2. Implement a no-prop client component in the category's `registry-<category>.tsx`
   (primitives in `src/components/tools/ui.tsx`; exemplar: `JsonFormatter`).
3. Map the id to the component in that registry file. The route, metadata, sitemap entry,
   breadcrumbs and FAQ scaffolding are generated automatically.

### Adding a portfolio record

Edit `src/data/portfolio.ts` — each record carries its sheet crops (exact coordinates from
the supplied sheets) and project metadata. The twelve current records are neutral **DEMO**
placeholders labelled as such in the UI.

---

## Privacy & security

- All file processing is client-side; object URLs are revoked after downloads.
- Network tools call only documented free public endpoints with request timeouts.
- Security headers (CSP, nosniff, referrer policy, permissions policy) are set in
  `next.config.ts`.
- HTML preview runs in a fully sandboxed iframe.

## Troubleshooting builds

- **`PageProps`/`LayoutProps` type errors** → run `npx next typegen` (generated route types).
- **`new Date()` prerender errors** → Cache Components forbids unstable time during prerender;
  use constants (see `SITE.year`).
- **pdf.js worker issues** → `src/lib/pdf/pdfjs.ts` resolves the worker from the module URL
  with a `/pdf.worker.min.mjs` copy in `public/` as fallback.
- **Build fails after pulling** → delete `.next` and `node_modules`, reinstall, rebuild.
