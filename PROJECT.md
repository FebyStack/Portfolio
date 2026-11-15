# Portfolio — Febriel B. Otud

One-page ASCII portfolio. Source of truth for look and behaviour: `design/Main.dc.html`
(Claude Design canvas export, artifact `6NeXsueHHaZ59dNx7zeXTw`), except the hero, header CTA, contact, section order and
sizing, work cards and project view, redesigned 2026-11-15 (see Decisions). `design/Brand.dc.html` = brand plan.
Copy comes only from the owner's own words (`Obsidian/Astro/Claude Code/Febriel Avatar Facts.md`); never invent clients,
numbers, dates, results or quotes.

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
  2026-11-15 rules (hero, header CTA, section padding, work cards, project dialog, contact rows).
- `src/engine.js` — the design's canvas engine (lines 451–1274), near-verbatim except the section reveal and the portrait below.
  Do not restyle it; port fixes only. `startEngine(logic)` → `{ sync, stop }`.
  - Section reveals replay (2026-11-15, owner): `inView()` (tested) reveals a `[data-sec]` once over 1/3 of
    min(viewport, section height) is on screen and dissolves it under 1/4 (hysteresis, so no flicker). Dissolve =
    the reveal in reverse: text scrambles back (`decode(el, 800, true)`; an opposite effect on a node is replaced and hands
    over its original text), the ambient veil swells and clears (sin envelope, 0.75 s) while rain/light fade, the hero
    portrait and about photo intros run backwards, content fades via `[data-fx=wait]` (0.75 s, the reveal's curve reversed).
    Coming back replays the first reveal exactly (veil 1 → 0, decode, intros from 0). A section's height is pinned for 1.5 s
    while its text plays (scrambled glyphs rewrap on phones); `sync()` drops pins since app changes win. No dissolve
    while the work modal is open or keyboard focus (`:focus-visible`) is inside; `focusin` reveals a hidden section.
    Reduced motion: unchanged (content always visible, no veil/decode/dissolve).
    Re-checked after sections became content-sized (2026-11-15): still no flicker, dissolve and replay work. Side effect:
    at 1440×900 the top ~180px of Work peeks under the marquee and stays blank until ~80px more is scrolled (785px section,
    reveal at >1/3). Fix if wanted: cap m at ~480px in `inView` (reveal at 160px, dissolve under 120px), which also
    makes sections dissolve later, so it was left for the owner to decide.
  - Hero portrait (2026-11-15, owner): ASCII only, a head-and-shoulders bust. The hover/tap ink reveal and its
    "Show the drawing" pin are gone; the 3D tilt and the pointer accent (a small accent-glyph cloud at the pointer,
    drifting on its own when nobody points) stay.
- `public/img/avatar-map.png` — the portrait's density map, 264×264 RGBA read by `buildAvatar`: channel 0 = tone,
  1 = accents (only hair uses them, dark mode), 2 = hair flag (low = hair: dark mode gives it a minimum density),
  alpha = subject mask. `.plate` (page colour, behind the canvas, keeps the ambient rain out of the portrait) masks with
  the same file's alpha, so its silhouette always matches. Built once (scratch script, not in the repo) from the
  head-only map of `26a4b8f` (traced from the INKWILD ink drawing): head scaled 0.75 into the top two-thirds, neck
  continued from its row 238, shoulders and V-neck t-shirt from `photo.webp`'s alpha (skin = warm pixels), shirt tone
  ≈0.5 from the photo's luminance (lighter mass than the face in dark mode, darker in light mode), 6px soft edges, a
  rounded vignette fading shoulders and bottom to dots. `public/img` also holds `photo.webp` (About photo);
  `avatar-ink.webp` was deleted with the reveal.
- `src/data.js` — `SKILLS`, `GROUPS`, `PROJECTS` (card order; fields `id title shape desc role type status more tools
  image alt`, optional `links: [[label, url], …]`) and `projectAt(hash)` (`#work/<id>` → index, else -1).
  Screenshots later = set `image` (+ `alt`) here only: it replaces the ASCII cover on the card and in the project view.
  `src/data.test.js` checks the hash mapping and that each card in `index.html` repeats its title, desc and meta line.
- `src/main.js` — state + DOM glue; replaces the design's `Component` class. Builds the `logic`
  object the engine expects.
- `supabase/migrations/*_chat_logs.sql` — record of the `chat_logs` table that stays in the hosted database after the
  chatbot's removal: RLS on, no policies, revoked from anon/authenticated; views `chat_daily` / `chat_review` /
  `chat_top_questions` (security_invoker); pg_cron job `chat-logs-retention` (180 days). `*_chat_logs_unanswered.sql` adds
  the `unanswered` column. Nothing in the site reads or writes it any more.

## Engine ↔ app contract

Engine reads only: `logic.{root,tilt,avatar,stage,globe,tide,photo,skl,deck}.current`,
`logic.state.{dark,svc,busy,cat,modal,time}`, `logic.props.{mode,motion,rain,light,glyph}`,
and calls `logic.setState({ time })` every 20 s. App calls `eng.sync()` after every state change.
Since the chatbot's removal `busy` (avatar "speaking") is always false and `time` is stored but not rendered.

## DOM contract (index.html ↔ main.js)

- Root `div#top.fbo.pal-tidal.is-dark[data-ref="root"]`; mode = swap `is-dark`/`is-light` (also sets `meta[name=theme-color]` to `--bg`).
  `main#main` holds, in order: hero, marquee, `#work`, `#services`, `#skills`, `#about`, `#contact` (nav and mobile menu
  follow that order). `footer` sits after `main`, still inside the root. Skip link targets `#main`. Sections size to their
  content: `.wrap` padding 96px (56px ≤820px), no min-height. `html{scroll-padding-top:80px}` keeps anchors and keyboard
  focus clear of the 64px sticky header (so `.sec` has no scroll-margin).
  Persisted in `localStorage['fbo-mode']` = `dark|light`, written only on an actual toggle; inline script after the root tag applies it pre-paint.
- Refs: `[data-ref="…"]` — `tilt avatar globe tide photo skl deck work menu catRows modalTpl`.
- Text bindings: `[data-bind="…"]` — `modeLabel catKicker catTitle`; in the project view: `modTitle modDesc modMore modFacts`.
- Actions: `[data-act="…"]` — `toggleMode toggleMenu closeMenu deckPrev deckNext closeModal copyEmail`.
  Escape with the mobile menu open closes it and focuses the menu button.
- Hero: `.wrap.stg` grid = `.hc` text column (`h1.nm` "Febriel <em>B. Otud</em>", `p.vp` (Gambetta 400), supporting `p`,
  `.hero-cta` with the Messenger `a.btn` + ghost "See my work", then `p.proof` "Recent work:" with plain underlined links
  to `#work/pilapass`, `#work/sev-clinic`, `#work/inkwild`) and `.av` (tilt → plate, avatar canvas) on the right / below
  ≤820px. No hero text is bound by JS. Inline text links keep the UA underline (accent vs body text is only 1.57:1).
- Header CTA: `a.btn.hcta` (same Messenger link) between the theme pill and the menu button; `aria-label` carries the name,
  its `span` label is `display:none` ≤1000px (icon only). ≤360px the theme pill hides its `modeLabel` word so the header fits 320px.
- New-tab hint: hidden `span#nt` ("Opens in a new tab") right after the skip link; every `target=_blank` link (also the
  project view's JS-built `links`) has `aria-describedby="nt"`.
- Services: `.pan[data-svc="0..3"]` > `button.ph` + `.pb` > `canvas[data-stage]`. Active = `.pan.on`;
  inactive `.pb` carries `hidden`. `logic.stage.current` = stage canvas of the active panel.
- Skills: `button[data-cat="all|build|design|social|video|ai"]`, active gets `.on`.
- Work cards (static, in `PROJECTS` order): `article.wk[data-scr]` > `.wki.cut` > `.wkc` > `canvas[data-cover="shape"]`
  (an `img` once `image` is set) + `.wkb` > `h3`, `p` (desc), `span.tg` ("role · type · status"), `a.wkl[href="#work/<id>"]`
  "View <title>", the card's one control; its `::after` covers the card, so the whole card opens it, and the card gets the
  focus ring (`.wk:has(.wkl:focus-visible)`). Cards carry no `id`: the browser's own scroll-to-fragment on a
  `#work/<id>` load would move focus off the open dialog. JS finds a card by its link's `href`.
- Project view: `<template data-ref="modalTpl">` (last child of `#work`, outside `.fxb`) holds `dialog.modal[data-modal]`
  (`aria-labelledby="mod-title"`). Cloned into `#work` and `showModal()`ed on open, closed and removed on close: the engine
  reads the mount (`[data-modal]` stops `#work` dissolving, `canvas[data-cover][data-big]` is its big cover, drawn only
  while `#work` is on screen, so opening scrolls `#work` into view instantly behind the dialog). Native focus trap,
  Escape, `::backdrop` (tint + blur); a click on the backdrop closes it; `html:has(.modal[open])` stops the page
  scrolling. Inside: `.mvid` > big cover (or `img`, `object-fit: contain`), `.mtop` > `h3#mod-title` + close
  `button[data-act=closeModal][autofocus]`, `p[modDesc]`, `p[modMore]`, `dl.mdl[modFacts]` (Role / Type / Tools / Status
  rows built by JS, empty ones skipped), then `.mlk` links (JS, after the `dl`).
- Project URLs: `#work/<id>` opens that project (`hashchange` → `route()`), so clicking a card or hero link pushes an
  entry and Back closes it. A close by button, Escape or backdrop restores `#work`: `history.back()` when the entry
  below is `#work` (came from `#work`, or a deep link), else `replaceState('#work')`, so no `#work` entries pile up.
  Loading `#work/<id>` replaces the entry with `#work` and pushes the project hash, so Back closes it instead of leaving.
  On every close, focus goes to that project's card link (the opener for card opens).
- Contact: `h2`, "Tell me what it is…", `.ctm` = the Messenger `a.btn` (only primary) + reply/availability `p`
  ("I reply within two hours, Philippine time (UTC+8)." / "Taking freelance and part-time projects now."); `.cta` row =
  `.eml` (mailto link showing the address + ghost `Copy` button, `copyEmail`: clipboard, else selects the address) then
  ghost `.sm` LinkedIn, Instagram, GitHub; `p.lab` "Follow INKWILD" + `a.lnk` TikTok / YouTube (`.lab .lnk` = ink).
  The tide canvas stays at the bottom of `#contact`; the copyright/back-to-top row is the `footer` after `main`.
- `.fbo [hidden]{display:none!important}` exists because layout rules out-rank the UA `[hidden]` rule.

## Run

- `npm run dev` (5173) · `npm run build` → `dist/` · `npm run preview` · `npm test` (node --test, no deps; engine + data tests)
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
- Design-tool tweak props (glyph, rain, light, motion) are constants in `main.js`.
- 2026-11-15: AI chatbot ("Ask my avatar", Groq via the Supabase `ask` function, rating thumbs) removed from the site and
  the code (owner's decision). The avatar's knowledge is kept outside the repo. The `chat_logs` table stays in Supabase by
  the owner's choice; the migration files are its record.
- Primary CTA = Facebook Messenger `https://m.me/febriel.otud.186` (hero, sticky header, contact), new tab. Messenger leads
  because Philippine visitors prefer chat (research in the untracked `research_notes/`, excluded via `.git/info/exclude`). Email, Instagram, LinkedIn,
  GitHub are secondary; INKWILD follow links (TikTok, YouTube) tertiary. "I reply within two hours" sits next to both CTAs.
- Hero (2026-11-15, "cluttered" before): 4 elements — name, value line (brand-plan positioning), one supporting line,
  two buttons — plus the portrait. Coordinates + live clock line dropped. Name: Gambetta 300, one line on desktop sized
  `min(8vw,128px,15cqi)` (container query on `.hc`) so the ASCII decode can't rewrap it (no CLS); two lines at
  `clamp(56px,8vw,128px)` ≤820px. Name parallax removed; portrait tilt kept (hover reveal and pin removed later the same day, see `engine.js`).
  Pointer ASCII light radius 64px and section glow 280px (2026-11-15, owner: smaller); the glow rests at the section's
  top edge (`--my` 0%) until the pointer moves it, so untouched sections and phones keep a faint top glow.
  Portrait `min(400px,42vh,34vw)`, 320px max ≤820px.
- Work as proof (2026-11-15, owner + research report P0-4): five projects, brand plan's three first: PilaPass, The Sev
  Clinic, INKWILD, Invex, KONSEPTO Events. The "Private client" card is folded into the content/motion service text
  ("…including ongoing video editing for a private client"). No "Play" anywhere and no `video` field (removed with the
  "[VIDEO GOES HERE]" placeholder; if a reel comes, add it as a field like `image`). Project images come later from the
  owner (set `image` in `data.js`). No prices on the site.
- Hero (2026-11-15, second pass): 5 text elements (name, offer line in Gambetta 400, supporting line "Taking freelance
  and part-time projects now. Remote, or on-site in Dipolog and Dapitan. I reply within two hours.", both buttons, proof
  line under them). Messenger button measured at y 462–518 on 375×812 (fold 812).
- Copy pass (2026-11-15, P2-12): each fact once. "Dipolog City" only in the About "Based in" tile (the hero says the
  Dipolog and Dapitan area); student status (third-year BS Information Systems, JRMSU Main Campus, Dapitan City,
  graduating 2028) only in the About paragraph; The Sev Clinic only in Work (About's "Currently" and "Studying" tiles
  dropped); AI stated in the About tile, the Skills group, and inside INKWILD's project view (marquee keeps its word).
  Hints describe content: "Four things. Most projects end up needing two or three of them." / "Pick a group to see its
  tools." / "Open a project for the details." "Available now" + the two-hour reply sit beside both Messenger buttons.
- No analytics (owner's decision): no page analytics, no cookies → no consent banner. If ever wanted: a cookieless one
  (Plausible / CF Web Analytics).
- Docker not needed: Supabase is hosted.

last Claude session: 2026-11-15 11:43
