# ROUTE 145 — Integration Contract (Wave 2)

**Home V8 — Phases 3–4 are done. This file is the contract for the
Wave 2 agents building Phase 5 (ten category worlds) and Phase 6
(tool directory).** Read it before writing any code.

## Where your sections mount

In `src/components/home-v8/HomeV8.tsx` there are two clearly-marked
slots, in this journey order:

```
hero → hub map → [PHASE 5 SLOT: <WorldsSection/>] → [PHASE 6 SLOT: <DirectorySection/>] → roadside stories → Pro band → next-stop teaser → footer
```

- **Phase 5:** `src/components/home-v8/WorldsSection.tsx`
  - Default export, **no props**, reads `src/data` directly.
  - Root element **must** carry `id="worlds"` (the sticky bar and
    the current-stop observer track it).
  - Content: the ten category worlds (one per category in
    `src/data/categories.ts` order). Do NOT re-add a popular-tools
    strip — `RoadsideStories.tsx` (the shell) already owns it.
- **Phase 6:** `src/components/home-v8/DirectorySection.tsx`
  - Default export, **no props**.
  - Root element **must** carry `id="directory"`.
  - Content: the full tool directory (all 145 tools, crawlable
    HTML — see the rules below). This is the "Final Destination"
    section.

Mount them by replacing the slot comments in `HomeV8.tsx` with the
imports + JSX. That is the **only** edit you may make to
`HomeV8.tsx`.

## Files you must NOT edit

`src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`,
`src/components/home-v8/HomeV8.tsx` (except the two slot lines),
`src/components/advertisements/AdSlot.tsx`,
`src/components/layout/SiteChrome.tsx`, `src/data/tools.ts`,
`src/data/categories.ts`, any tool implementation, any tool page.

Build **only your own files** under `src/components/home-v8/`.

## Design tokens — use these, nothing else

All tokens are CSS custom properties defined in `globals.css`
under the `.home-v8` system:

| Token | Value | Use |
|---|---|---|
| `--v8-bg` | `#070912` | Page background |
| `--v8-bg-2` | `#101525` | Raised / secondary surface |
| `--v8-accent` | `#8B7CFF` | Primary accent (violet) — focal points only |
| `--v8-accent-2` | `#36D9FF` | Secondary accent (cyan) — sparingly |
| `--v8-highlight` | `#C5A6FF` | Highlight (soft lavender) |
| `--v8-text` | `#F5F6FF` | Primary text |
| `--v8-muted` | `#A3A9BD` | Muted text (8.5:1 on `--v8-bg`, AAA) |
| `--v8-line` | `rgba(245,246,255,0.12)` | 1px hairlines |
| `--v8-line-strong` | `rgba(245,246,255,0.22)` | Stronger hairlines / borders |

Use Tailwind utilities plus `var(--v8-*)` arbitrary values, e.g.
`text-[var(--v8-muted)]`, `bg-[var(--v8-bg-2)]`,
`border-[var(--v8-line)]`. Do **not** invent new hex colours.
Glow is controlled: only the hero portal glows. Do not make
everything glow — one focal glow per section at most.

## Reusable utility classes (in `globals.css`)

- `.v8-glass` — frosted dark glass panel (default card surface):
  `rgba(16,21,37,0.62)` + 1px hairline + 14px blur.
- `.v8-glass-soft` — lighter glass for cards inside sections.
- `.v8-eyebrow` — small letterspaced uppercase label
  (`<span class="v8-dot">●</span>` colours the dot violet).
- `.v8-outline` — outlined display text (footer wordmark style).
- `.v8-link-line` — underline-reveal for inline links.
- `.v8-btn-primary` — violet fill, near-black text (≈6:1, AA).
  Hover state is built in.
- `.v8-btn-ghost` — transparent, hairline border, light text.
- `.v8-topo-bg` — faint topo contour texture for section backs.
- `.v8-reveal` + `[data-stagger-item]` inside `[data-stagger-group]`
  — GSAP scroll reveals (initial states live under
  `html.js-anim`; GSAP in `HomeV8.tsx` animates them to final).
  Add the classes to your elements and they reveal for free.
  Reduced motion is handled globally — never animate these
  yourself.

## Typography — exactly two faces

- **Display:** Anta (`font-anta`) — headlines, stop names,
  numbers, the wordmark. Uppercase for big headlines.
- **Body:** Space Grotesk (`font-grotesk`) — everything else,
  including eyebrows, buttons, labels and body copy.
- Nicknames / editorial labels: **italic Space Grotesk**
  (`font-grotesk italic`), NOT a script face. The V7 Caveat
  script voice was deliberately retired to keep the two-face
  discipline. Do not add a third font.

## Patterns to follow

- **Section header:** eyebrow (`Stop 0X — …` or similar) +
  huge Anta headline with one violet word + a short italic
  Grotesk line on the right. See `HubMap.tsx` / `RoadsideStories.tsx`.
- **Cards:** `.v8-glass-soft`, `rounded-3xl`, `p-6`, hover
  `border-[var(--v8-accent)]`. Whole-card links to real pages.
- **Numbers:** Anta, violet for the accent number
  (e.g. `TOOL 001`, `STOP 01`).
- **Buttons:** `.v8-btn-primary` for the one primary action per
  section, `.v8-btn-ghost` for secondary actions. Never a
  gradient fill.
- **Icons:** `lucide-react`, 1px-ish stroke, `aria-hidden` when
  decorative.

## Hard rules

1. **Real data only.** Every tool name, description, count, link
   and route comes from `src/data/tools.ts` /
   `src/data/categories.ts` (see `routeData.ts` for the `STOPS`
   / `STORIES` helpers already built from them). Never invent a
   tool, category, count, price, sponsor or stat.
2. **Crawlable HTML.** Every tool name and description must be in
   plain HTML. Never hide content inside WebGL/canvas. If you
   add any 3D, it is decoration only — the content stays in the
   DOM.
3. **No new dependencies** unless genuinely needed (gsap, lenis,
   framer-motion, motion, three + @react-three/fiber/drei are
   already installed). No paid dependencies, no credentials in
   frontend code, no MotionSites `get_prompt` calls (0 free
   prompts left).
4. **Accessibility:** keyboard navigation throughout,
   focus-visible rings (built into `.home-v8`), readable
   contrast, `prefers-reduced-motion` respected (use the
   `.v8-reveal` classes, never custom entrance animations),
   tools reachable without completing the journey.
5. **Performance:** any 3D you add follows the hero's rules —
   `next/dynamic` + `ssr:false`, mounted only near the viewport,
   DPR capped 1.75/1.5, frameloop paused offscreen, ~20 meshes
   max, no shadows, no post-processing, static frame for
   reduced motion.
6. **Ads:** do not touch `AdSlot.tsx` or flip `SITE.adsEnabled`
   (stays `false`). Ad slots live in `RouteAds.tsx`; do not add
   more.
7. **Do not edit** `globals.css`, `layout.tsx`, `page.tsx`,
   `HomeV8.tsx` (except the slot lines), `AdSlot.tsx`,
   `SiteChrome.tsx`, or any file outside `home-v8/`.
