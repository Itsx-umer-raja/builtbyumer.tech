# BuiltByUmer — Upload to GitHub & Deploy on Vercel

This zip is the complete BuiltByUmer website (builtbyumer.tech): 145 free
browser-based tools, 181 pages, Next.js + React + TypeScript + Tailwind v4.
The build was verified on 20 Nov 2026 (181/181 pages, no errors).

## What's inside

- The full V2 rebuild: dark editorial homepage, all tool pages, about /
  contact / tools / portfolio pages, sitemap, robots, SEO metadata.
- shadcn components + VengeanceUI components (AnimatedRays, aurora-hero,
  animated-number, gooey-text-reveal, spotlight-navbar) in
  `src/components/ui/`.
- A subtle ResourceBoy white-paper texture baked into the light pages
  (inside `src/app/globals.css` as an embedded image — no separate file,
  per ResourceBoy's licence).
- `.mcp.json` — the shadcn MCP server config (kept as requested).

Not included (rebuilt automatically): `node_modules`, `.next`, `.git`.

## 1. Put it on GitHub

Option A — GitHub website (easiest, no terminal):
1. Go to https://github.com/new and create a repository
   (e.g. `builtbyumer.tech`). Leave it empty — no README, no .gitignore.
2. Unzip this file on your computer.
3. On the new repo page, click "uploading an existing file", drag in ALL
   the unzipped files and folders, and commit.

Option B — terminal (if you use git):
```
cd builtbyumer
git init
git add .
git commit -m "BuiltByUmer full site"
git branch -M main
git remote add origin https://github.com/Itsx-umer-raja/builtbyumer.tech.git
git push -u origin main
```
(If that repo already exists, this replaces its contents — make sure you
want that before pushing.)

## 2. Deploy on Vercel

1. Go to https://vercel.com/new and import the GitHub repository.
2. Framework preset: **Next.js** (Vercel detects it automatically).
3. Build command: `npm run build` (default). Output directory: default.
4. No environment variables are needed — the site needs none.
5. Click Deploy. Vercel installs dependencies, builds, and gives you a
   live URL like `builtbyumer-tech.vercel.app`.
6. To use your own domain (builtbyumer.tech): in Vercel go to the
   project → Settings → Domains → add `builtbyumer.tech` and follow the
   DNS steps Vercel shows.

## 3. After deploying

- Test the homepage, open a few tools (PDF, image, QR), and check the
  site on your phone.
- Every time you push a change to GitHub, Vercel redeploys automatically.

## Notes

- Requires Node.js 18 or newer (built with Node 24).
- Run locally with: `npm install` then `npm run dev`.
- The ResourceBoy texture is embedded in the CSS on purpose: ResourceBoy's
  licence does not allow uploading its source files to GitHub, so the
  texture ships inside the stylesheet as part of the finished design.
