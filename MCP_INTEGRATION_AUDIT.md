# MCP Integration Audit — BuiltByUmer

**Project:** BuiltByUmer (builtbyumer.tech) — free online tools platform, Next.js 16 / React 19 / TypeScript / Tailwind v4, 145 tools, 181 pages.
**Date:** 2026-11-20. **Status:** living document — updated as later phases use more integrations.
**Rule applied throughout:** nothing is listed as connected or used unless it was actually verified. Availability of a connector document is not a connection.

## 1. Discovered MCP servers (project configuration)

The only MCP configuration in the project is `~/workspace/builtbyumer-review/.mcp.json` (no other `.mcp.json` exists in the workspace):

| Server | Config | Connection status | Tools / capabilities |
|---|---|---|---|
| `shadcn` | `npx shadcn@latest mcp` (stdio) | **Configured but NOT answering** — the server returned no response on two stdio attempts on 2026-11-20. 7 tools were verified live on 2026-11-18 (component search/install). | Component registry: search and install shadcn UI components. **Workaround in use:** the registry is used directly via `npx shadcn@latest add <registry URL>` (works). |
| *(no other MCP server is configured in the project)* | — | — | — |

## 2. Custom connectors (Muse custom integrations)

| Integration | Type | Connection status | Tools / capabilities |
|---|---|---|---|
| `custom.motionsites` (MotionSites) | Hosted MCP at `https://motionsites.ai/api/mcp`, OAuth2 via Supabase, credential in Secure Vault | **Connected.** Verified live 2026-11-18 (`list-tools`, `my_account`). Account: **free plan, 0 of 3 prompts left** (last spent 2026-11-20 on the "Synthora Hero" design, with user authorization). | Read tools (free): `list_prompts`, `search_prompts`, `find_designs`, `list_sections`, `show_designs`, `get_related_prompts`, `build_page_plan`, `my_account`, `remix_site`. Write/design tool `get_prompt` costs one prompt — **do not call it on the free plan**. |
| `custom.resourceboy` (ResourceBoy) | **Not an MCP server, no API, no npm package.** Tested workflow: search the site, follow download links. | **Working as a workflow.** Verified live 2026-11-20 (search works without login; Exclusive packs download direct from `files.resourceboy.com`). | Search helper `bin/search.py`; graphic-design resources (textures, mockups, fonts, photos). License: Exclusive products royalty-free for commercial website use, no attribution; source packs must NOT be redistributed or committed to GitHub; most fonts are personal-use only. Caveats: many download buttons redirect to third-party sites; texture packs are huge (240 MB–1.8 GB). |

## 3. System connectors — connection status (checked 2026-11-20)

A connector document existing in `/opt/hatch/connectors/` does **not** mean it is connected. Statuses below were checked live where a CLI exists; otherwise the status is "no evidence of connection".

| Integration | Status | Evidence |
|---|---|---|
| **GitHub** | **Connected and authenticated** | `github status`: `auth_status: connected`, `authenticated: true`, endpoint `https://api.githubcopilot.com/mcp/` (GitHub's official MCP server). Tools include `get_file_contents`, `list_commits`, `push_files`, `search_code`, `create_or_update_file`, `create_branch`, `list_branches`, `search_repositories`, `get_me`, and more (full list in the status output). Repository `Itsx-umer-raja/builtbyumer.tech` selected for the installation. |
| **Vercel** | **Not connected** | `vercel status`: `auth_status: not_connected`, `authenticated: false`. The user deploys on Vercel manually himself. |
| **Figma** | **Not connected** | `figma status`: `auth_status: not_connected`, `authenticated: false`. No Figma files have been provided. |
| **Canva** | **Not connected** | `canva status`: `not_connected`, "no canva config found". |
| **Google Drive** | **Not connected** | No CLI; connector document exists. The user declined to connect it himself (2026-11-18). |
| **Google Docs / Notion / local_falcon** | **No evidence of connection** | No CLI at `/opt/hatch/bin/` for these; status could not be verified through a CLI, and no connection has been used in this project. Treat as not connected. |
| **Analytics / Search Console / error monitoring** | **No connector available** | No Google Analytics, Google Search Console, Sentry (or similar) connector exists in this environment. These cannot be connected through the available ecosystem without a custom setup. |
| **Cloud browser** | **Available** | Muse's own cloud browser (default). Used for research, the Expedia Route 66 study, GitHub web media upload, and site checks. No device browser is available for the current session. |

## 4. Which integrations were actually used — and for what

| Integration | Tasks performed (this project, 2026-11-17 → 2026-11-20) |
|---|---|
| **GitHub** | Repository inspection; 6 snapshot-push commits to `Itsx-umer-raja/builtbyumer.tech` (main): `2b7354f` full site, `6d99014` homepage V3, `23b237a` homepage V4, `eca1269` homepage V4.1, `a842620` homepage V5, `70fc0ba` homepage V7 (Route 145); per-path sync-base verification before each push (sync record at `~/workspace/builtbyumer-review.muse-github-snapshot-sync.json`); file-content reads for verification after each push. |
| **shadcn (registry via CLI)** | Installed via `npx shadcn@latest add`: `button`, `animated-rays`, `aurora-hero`, `animated-number`, `gooey-text-reveal`, `spotlight-navbar`, `border-beam` (+ `motion` package). MCP server itself did not answer; the registry path was used instead. |
| **MotionSites MCP** | Design research: `find_designs`, `search_prompts`, `build_page_plan`, `list_prompts`, `list_sections`, `get_related_prompts` (Glow Features direction, Synthora Hero planning). One `get_prompt` spent (Synthora Hero, user-authorized). 0 free prompts remain. |
| **VengeanceUI** | No MCP/CLI exists on npm (both packages 404). Used via the shadcn registry instead (`animated-rays`, etc.). |
| **ResourceBoy workflow** | Searches (textures, smoke/fire); downloaded the Exclusive "50+ White Paper Textures" pack's subtle white paper texture and baked it into the site as an 18 KB base64 data URI (source JPG deliberately not shipped). |
| **Cloud browser** | Expedia Route 66 design study (31 min, 2026-11-20); GitHub web upload of 29 binary media files (5 commits); research on award-winning homepages, premium SaaS design, tool-site monetization, AdSense placement; Vercel/GitHub connection checks. |
| **AdSense (not MCP — site integration)** | Already wired at account level by the site itself: publisher `pub-4227183622564894`, `ads.txt` served, verification file `google83a962037754e787.html`, account script in `src/app/layout.tsx`. `SITE.adsEnabled` is `false`; real `<ins class="adsbygoogle">` units were implemented in `AdSlot.tsx` (2026-11-20) and slots placed on the homepage, still gated off pending AdSense approval. |

## 5. Connections NOT used — and why

| Connection | Why not used |
|---|---|
| Vercel | Not connected; the user deploys manually himself. No deployment automation was set up. |
| Figma | Not connected; no Figma design files were provided for this project. |
| Google Drive / Google Docs | Not connected (user declined to connect Drive himself). No project documents were stored there. |
| Canva / Notion / local_falcon | No evidence of connection; no task in this project required them. |
| Analytics / Search Console / error monitoring | No connector exists for these in this environment; nothing was faked. The site currently has no analytics or error-monitoring integration. |
| WhatsApp | Personal WhatsApp only; the user's pasted WhatsApp Agents API key (2026-11-18) is **exposed and must never be used**. No WhatsApp integration was built into the website. |

## 6. Security considerations

- **No credentials in the website.** No MCP endpoint, access token, API key, OAuth credential, account identifier or private config file is present in frontend code, bundles, HTML, browser storage or the public GitHub repository. `.mcp.json` contains only a public `npx` command (no secrets). The MotionSites OAuth credential lives in Muse's Secure Vault, not in the repo.
- **Development-time only.** All MCP/connector use is development-time. The finished website is fully independent of private developer MCP sessions and keeps working when those connections are unavailable.
- **Public identifiers by design.** The AdSense publisher ID (`pub-4227183622564894`) is intentionally public (it is in `ads.txt` and the AdSense script, as Google requires).
- **Exposed key.** The user's WhatsApp Agents API key was pasted into chat on 2026-11-18 and is therefore exposed; it must never be used or recorded, and the user was advised to delete/regenerate it.
- **Ad slots are gated.** `SITE.adsEnabled` stays `false` until AdSense approves the live site; slots render nothing while disabled, so no blank or policy-violating ad requests are made.
- **Approvals.** Production pushes to GitHub run under the user's standing permission to auto-push homepage changes (given 2026-11-20). Any future production deployment, account change or infrastructure change needs its own approval.
- **Privacy.** File processing on BuiltByUmer is client-side; uploads never leave the user's device. No unnecessary third-party data sharing was added.

## 7. Recommendations for future integrations

1. **Connect Vercel** (when the user wants it) — enables deployment automation, preview deployments per push, and deployment status checks from the development environment. The user currently deploys manually; do not connect it without his say-so.
2. **Add analytics the honest way** — there is no Google Analytics connector here; if analytics is wanted, add a privacy-respecting, cookie-light option (e.g. Plausible/Umami) via a small script tag, or set up a custom connector. Do not add heavy tracking to a tools site whose selling point is privacy ("files never leave your device").
3. **Search Console** — no connector exists here; the user can verify the live site in Google Search Console himself, or a custom connector can be built later. Keep `sitemap.xml` and `robots.txt` intact either way.
4. **Figma** — connect only if the user starts working in Figma; until then it adds nothing.
5. **MotionSites paid plan** — only if the user wants more AI-generated design prompts; the free plan is exhausted (0/3). Do not spend anything without his approval.
6. **Error monitoring** — no connector exists; a lightweight client-side error reporter could be added later if the user wants it, but it is optional for a static tools site.
7. **Keep the audit current** — every new integration used in later phases must be added here with the task it performed. Never claim an integration was used unless it was actually used.
