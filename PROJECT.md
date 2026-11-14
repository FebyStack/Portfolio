# Portfolio — Febriel B. Otud

One-page ASCII portfolio. Source of truth for look and behaviour: `design/Main.dc.html`
(Claude Design canvas export, artifact `6NeXsueHHaZ59dNx7zeXTw`), except the hero, header CTA and contact
buttons, redesigned 2026-11-15 (see Decisions). `design/Brand.dc.html` = brand plan.

## Architecture (and why)

- **Vite + vanilla HTML/CSS/JS. No framework, no TypeScript.** The page is one static document
  plus one canvas engine; state is ~7 fields. Static markup in `index.html` = full content
  without JS (SEO, no hydration). Trade-off: no component model. If a second page/blog
  appears, move to Astro and keep `src/engine.js` as-is.
- **Coding rules: ponytail** (`~/.claude/plugins/marketplaces/greenpt/bench/variants/ponytail.md`).
  Stdlib/native first, fewest files, `ponytail:` comment on every intentional shortcut.
- `index.html` — all markup, copied from the design template. Inline styles kept verbatim on purpose
  (diffable against the design); the 2026-11-15 hero uses classes in `styles.css` instead.
- `src/styles.css` — the design's `<helmet><style>`, verbatim, fonts/images repointed to `/fonts`, `/img`, plus the
  2026-11-15 hero / header-CTA rules.
- `src/engine.js` — the design's canvas engine (lines 451–1274), near-verbatim. Do not restyle it;
  port fixes only. `startEngine(logic)` → `{ sync, stop }`.
- `src/data.js` — `SKILLS`, `GROUPS`, `PROJECTS` (set `video` per project here; optional `links: [[label, url], …]`).
- `src/main.js` — state + DOM glue; replaces the design's `Component` class. Builds the `logic`
  object the engine expects.
- `supabase/migrations/*_chat_logs.sql` — record of the `chat_logs` table that stays in the hosted database after the
  chatbot's removal: RLS on, no policies, revoked from anon/authenticated; views `chat_daily` / `chat_review` /
  `chat_top_questions` (security_invoker); pg_cron job `chat-logs-retention` (180 days). `*_chat_logs_unanswered.sql` adds
  the `unanswered` column. Nothing in the site reads or writes it any more.

## Engine ↔ app contract

Engine reads only: `logic.{root,tilt,avatar,stage,globe,tide,photo,skl,deck}.current`,
`logic.state.{dark,svc,pin,busy,cat,modal,time}`, `logic.props.{mode,motion,rain,light,glyph,reveal}`,
and calls `logic.setState({ time })` every 20 s. App calls `eng.sync()` after every state change.
Since the chatbot's removal `busy` (avatar "speaking") is always false and `time` is stored but not rendered.

## DOM contract (index.html ↔ main.js)

- Root `div#top.fbo.pal-tidal.is-dark[data-ref="root"]`; mode = swap `is-dark`/`is-light` (also sets `meta[name=theme-color]` to `--bg`).
  Hero through contact (incl. marquee) sit in `main#main`; skip link targets `#main`.
  Persisted in `localStorage['fbo-mode']` = `dark|light`, written only on an actual toggle; inline script after the root tag applies it pre-paint.
- Refs: `[data-ref="…"]` — `tilt avatar globe tide photo skl deck work menu catRows modalTpl`.
- Text bindings: `[data-bind="…"]` — `modeLabel catKicker catTitle`; in modal: `modTitle modDesc modTags`.
- Actions: `[data-act="…"]` — `toggleMode toggleMenu closeMenu togglePin deckPrev deckNext closeModal`.
- Hero: `.wrap.stg` grid = `.hc` text column (`h1.nm` "Febriel <em>B. Otud</em>", `p.vp`, supporting `p`, `.hero-cta` with
  the Messenger `a.btn` + ghost "See my work") and `.av` (tilt → plate, avatar canvas, pin button) on the right / below ≤820px.
  No hero text is bound by JS.
- Header CTA: `a.btn.hcta` (same Messenger link) between the theme pill and the menu button; `aria-label` carries the name,
  its `span` label is `display:none` ≤1000px (icon only). ≤360px the theme pill hides its `modeLabel` word so the header fits 320px.
- New-tab hint: hidden `span#nt` ("Opens in a new tab") right after the skip link; every `target=_blank` link in `index.html`
  has `aria-describedby="nt"` (the modal's JS-built `links` don't yet).
- Services: `.pan[data-svc="0..3"]` > `button.ph` + `.pb` > `canvas[data-stage]`. Active = `.pan.on`;
  inactive `.pb` carries `hidden`. `logic.stage.current` = stage canvas of the active panel.
- Skills: `button[data-cat="all|build|design|social|video|ai"]`, active gets `.on`.
- Work cards: `button.wk[data-open="N"]` (N = `PROJECTS` index), canvas `data-cover="shape"`.
- Modal: `<template data-ref="modalTpl">` (last child of `#work`). Cloned in on open, removed on
  close — engine relies on mount/unmount. While open, `#work .wrap` is `inert`. Inside: `.modal[data-modal]`, `[data-ref="mclose"]`,
  `video[data-ref="vid"]`, and `[data-novideo]` on the cover canvas (`data-big="1"`) and its label. A project's `links` are
  built by JS right after `modTags` (no hook): a flex row of `a.btn.ghost.sm[data-scr][target=_blank][rel=noopener]` + arrow icon.
- Contact: `.cta` row = Messenger `a.btn` (primary), then ghost Instagram, email (raw address), LinkedIn, GitHub; the line
  above ends "I reply within two hours."; below, `p.lab` "Follow INKWILD" + `a.lnk` TikTok / YouTube (`.lab .lnk` = ink).
- `.fbo [hidden]{display:none!important}` exists because layout rules out-rank the UA `[hidden]` rule.

## Run

- `npm run dev` (5173) · `npm run build` → `dist/` · `npm run preview` · `npm test` (node --test, no deps; engine tests only)
- No env vars and no secrets in the client; `.env` / `.env.*` stay gitignored.
- Supabase (CLI v3 via `npx --yes supabase@latest`; project ref `lsuqyuelsxcawfvbfbmu`, linked, link state in gitignored
  `supabase/.temp`) now only holds `chat_logs` + its views and cron job. Database commands need `--remote`
  (`migration list --remote`, `db query --remote --read-only`).
- Pending outside the repo (owner/conductor, after this version is live): delete the deployed `ask` edge function and its
  secrets (`GROQ_API_KEY`, `GROQ_MODEL`, `ALLOWED_ORIGIN`) — e.g. `functions delete ask`, `secrets unset …`. Not done here.

## Decisions / dead-ends

- Canonical, `og:url`, JSON-LD `url`, `public/sitemap.xml` and the robots `Sitemap:` line are hardcoded to
  `https://febrielportfolio.vercel.app/` (an env placeholder once shipped as a literal). Change all five if the domain changes.
- Palette fixed to Tidal Orchid; the other two palettes stay in CSS (class swap on root) — design tweak, not UI.
- Design-tool tweak props (glyph, reveal, rain, light, motion) are constants in `main.js`.
- 2026-11-15: AI chatbot ("Ask my avatar", Groq via the Supabase `ask` function, rating thumbs) removed from the site and
  the code (owner's decision). The avatar's knowledge is kept outside the repo. The `chat_logs` table stays in Supabase by
  the owner's choice; the migration files are its record.
- Primary CTA = Facebook Messenger `https://m.me/febriel.otud.186` (hero, sticky header, contact), new tab. Messenger leads
  because Philippine visitors prefer chat (research in the untracked `research_notes/`, excluded via `.git/info/exclude`). Email, Instagram, LinkedIn,
  GitHub are secondary; INKWILD follow links (TikTok, YouTube) tertiary. "I reply within two hours" sits next to both CTAs.
- Hero (2026-11-15, "cluttered" before): 4 elements — name, value line (brand-plan positioning), one supporting line,
  two buttons — plus the portrait. Coordinates + live clock line dropped. Name: Gambetta 300, one line on desktop sized
  `min(8vw,128px,15cqi)` (container query on `.hc`) so the ASCII decode can't rewrap it (no CLS); two lines at
  `clamp(56px,8vw,128px)` ≤820px. Name parallax removed; portrait tilt, hover reveal and pin kept.
  Portrait `min(400px,42vh,34vw)`, 320px max ≤820px.
- No analytics (owner's decision): no page analytics, no cookies → no consent banner. If ever wanted: a cookieless one
  (Plausible / CF Web Analytics).
- Docker not needed: Supabase is hosted.

last Claude session: 2026-11-15 01:06
