# Portfolio — Febriel B. Otud

One-page ASCII portfolio. The design system is locked in `DESIGN.md` (2026-11-18: palette, type and spacing scales,
radii, motion budget, the owner's decisions and the Hallmark waivers); read it before any visual change. The original
look is `design/Main.dc.html` (Claude Design canvas export, artifact `6NeXsueHHaZ59dNx7zeXTw`), except the hero, header
CTA, contact, section order and sizing, work cards and project view, redesigned 2026-11-15, and the 2026-11-18 Hallmark
pass (see Decisions). `design/Brand.dc.html` = brand plan.
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
  (diffable against the design; their gaps snapped to the 4px scale on 2026-11-18); the 2026-11-15 hero uses classes in
  `styles.css` instead.
- `src/styles.css` — the design's `<helmet><style>`, fonts/images repointed to `/fonts`, `/img`, plus the 2026-11-15
  rules (hero, header CTA, section padding, work cards, project dialog, contact rows) and the 2026-11-18 Hallmark pass:
  `:root` holds the colours `html` paints itself (page background, `scrollbar-color`) and the Tidal blocks reuse them;
  `html, body` clip overflow-x; `.fbo` is an inline-size container, so `100cqw` (not `100vw`) makes the deck and the
  phone skill-group row full bleed; spacing on a 4px scale; labels and controls in sentence case; print shows every
  section.
  - Type scale (2026-11-15, P2-11; 2026-11-18): every text size is a token on `.fbo`, used by the CSS and by
    `index.html`'s inline styles. `--fs-xs` 12px (Geist Mono labels, tags, small links, `dt`s, marquee) · `--fs-sm` 14px
    (buttons, nav and menu links, mono notes: logo, hints, tool rows; the proof line) · `--fs-md` 17px (Switzer reading text, line-height 1.5; closed service tabs) ·
    `--fs-lg` `clamp(22px,2.1vw,30px)` (offer line, About statement, card, panel and project titles) · `--fs-xl`
    `clamp(36px,4vw,60px)` (section headings) · `--fs-2xl` `clamp(40px,5.6vw,84px)` (the contact line) · `--fs-name`
    `clamp(56px,8vw,128px)` (the name, two lines at every width). `--measure: 40ch` caps Switzer paragraphs at about
    46–52 characters, the brand plan's line length (`ch` is the width of "0", so 52ch rendered 59–73). Light 300 only for
    the name; headings and the About statement are Gambetta 400. The outlined "Febriel" behind the About photo (`.abg`) is
    artwork sized to the photo, outside the scale. `text-wrap: balance` on h1–h3 and on short blocks (tags, card blurbs,
    `dd`s, footer lines), `pretty` on paragraphs (`.vp` balance), so nothing ends on a lone word at 375 or 1280.
    Labels and controls are sentence case, tracked 0–0.03em (owner, 2026-11-18); only the marquee keeps its capitals.
- `src/engine.js` — the design's canvas engine (lines 451–1274), near-verbatim except the section reveal and the portrait below.
  Do not restyle it; port fixes only. `startEngine(logic)` → `{ sync, stop }`.
  - Section reveals replay (2026-11-15, owner): `inView()` (tested) reveals a `[data-sec]` once 160px of it is on
    screen (a third of the section or of the viewport when that is less, so it can always get there) and dissolves it
    under 60% of that, 96px (hysteresis, so no flicker). The section observer's `rootMargin` drops the strip under the
    sticky header (its height, read once at start), so "on screen" means below the header and a section leaving upward
    still shows its dissolve. Dissolve =
    the reveal in reverse: text scrambles back (`decode(el, 800, true)`; an opposite effect on a node is replaced and hands
    over its original text), the ambient veil swells and clears (sin envelope, 0.75 s) while rain/light fade, the hero
    portrait and about photo intros run backwards, content fades via `[data-fx=wait]` (0.75 s, the reveal's curve reversed).
    Coming back replays the first reveal exactly (veil 1 → 0, decode, intros from 0). A section's height is pinned for 1.5 s
    while its text plays (scrambled glyphs rewrap on phones); `sync()` drops pins since app changes win. No dissolve
    while the work modal is open or keyboard focus (`:focus-visible`) is inside; `focusin` reveals a hidden section.
    Reduced motion: unchanged (content always visible, no veil/decode/dissolve).
    Checked 2026-11-15 after the 160px rule (headless Chrome, 1440×900 and 375×812): every section reveals and dissolves
    once per pass down and up; a 12× jiggle across a reveal line toggles once; no console errors. Since 2026-11-18 the
    first screen at 1440×900 ends on the marquee: 66px of Work's empty top padding show under it, so nothing sits
    half-revealed (at 1920×1080, 208px of Work show and it reveals).
  - About photo (2026-11-15, P1-10): fetched by a one-shot IntersectionObserver once the photo canvas is within one
    viewport of the screen (`rootMargin` 100% at the bottom), not at startup (first request at scrollY 1440 of 3880 on
    1440×900).
  - `ponytail:` note in `frame()`: every layer draws with `fillText`; ceiling about 3–7 ms per draw on a fast Mac.
    Upgrade path: a glyph atlas or an OffscreenCanvas worker (not done).
  - Hero portrait (2026-11-15, owner): ASCII only, a head-and-shoulders bust. The hover/tap ink reveal and its
    "Show the drawing" pin are gone; the 3D tilt and the pointer accent (a small accent-glyph cloud at the pointer,
    drifting on its own when nobody points) stay.
  - Work covers (2026-11-18, owner: one hover effect per card): hovering a card no longer speeds its cover up or draws it
    every frame; the card's hover is the text scramble. Only the project view's big cover turns faster.
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
  `src/data.test.js` checks the hash mapping, that each card in `index.html` repeats its title, desc and tag spans, and
  that the skills card's static kicker is `SKILLS.length` tools.
- `src/main.js` — state + DOM glue; replaces the design's `Component` class. Builds the `logic`
  object the engine expects.
- `supabase/migrations/*_chat_logs.sql` — record of the `chat_logs` table that stays in the hosted database after the
  chatbot's removal: RLS on, no policies, revoked from anon/authenticated; views `chat_daily` / `chat_review` /
  `chat_top_questions` (security_invoker); pg_cron job `chat-logs-retention` (180 days). `*_chat_logs_unanswered.sql` adds
  the `unanswered` column. Nothing in the site reads or writes it any more.

## Engine ↔ app contract

Engine reads only: `logic.{root,tilt,avatar,stage,globe,tide,photo,skl,deck}.current`,
`logic.state.{dark,svc,cat,modal}`, `logic.props.{mode,motion,rain,light,glyph}`, and never writes app state (the
design's 20 s clock with its `time`, and the avatar's `busy`/"speaking", went with the chatbot). App calls `eng.sync()`
after every state change; `sync()` also drops the sections' height pins, so nothing should call it on a timer.

## DOM contract (index.html ↔ main.js)

- Root `div#top.fbo.pal-tidal.is-dark[data-ref="root"]`; mode = swap `is-dark`/`is-light` (also sets `meta[name=theme-color]` to `--bg`).
  `main#main` holds, in order: hero, marquee, `#work`, `#services`, `#skills`, `#about`, `#contact` (nav and mobile menu
  follow that order). `footer` sits after `main`, still inside the root. Skip link targets `#main`. Sections size to their
  content, no min-height: `.wrap` padding 96px (56px ≤820px), `#services` 144/72 (88/40), the About band
  (`section.band`, background `--band`) 120/120 (72/72), so the seams vary. `html{scroll-padding-top:80px}` keeps anchors and keyboard
  focus clear of the 64px sticky header (so `.sec` has no scroll-margin).
  Persisted in `localStorage['fbo-mode']` = `dark|light`, written only on an actual toggle; inline script after the root tag applies it pre-paint,
  and with nothing stored follows the OS (`prefers-color-scheme: light` → light, otherwise the markup's dark default).
  `state.dark` reads that class, so script and app agree; `render` then sets `theme-color`. The theme pill's `aria-label`
  starts with its visible word (WCAG 2.5.3): "Dark mode, switch to light" / "Light mode, switch to dark".
- Refs: `[data-ref="…"]` — `tilt avatar globe tide photo skl deck work menu catRows modalTpl`.
- Text bindings: `[data-bind="…"]` — `modeLabel catKicker catTitle`; in the project view: `modTitle modDesc modMore modFacts`.
- Actions: `[data-act="…"]` — `toggleMode toggleMenu closeMenu deckPrev deckNext closeModal copyEmail`.
  Escape with the mobile menu open closes it and focuses the menu button.
- Hero: `.wrap.stg` grid = `.hc` text column (`h1.nm` "Febriel <span>B. Otud</span>", the span a block line: the orchid
  italic surname under "Febriel" at every width; `p.vp` (Gambetta 400), supporting `p`, `.hero-cta` with the Messenger
  `a.btn` + ghost "See my work", then `p.proof` "Recent work: PilaPass, The Sev Clinic and INKWILD" with plain underlined
  links to `#work/pilapass`, `#work/sev-clinic`, `#work/inkwild`) and `.av` (tilt → plate, avatar canvas) on the right /
  below ≤820px. No hero text is bound by JS. Inline text links keep the UA underline (accent vs body text is only 1.57:1).
- Header CTA: `a.btn.hcta` (same Messenger link) between the theme pill and the menu button; `aria-label` carries the name,
  its `span` label is `display:none` ≤1000px (icon only). ≤360px the theme pill hides its `modeLabel` word so the header fits 320px.
- New-tab hint: hidden `span#nt` ("Opens in a new tab") right after the skip link; every `target=_blank` link (also the
  project view's JS-built `links`) has `aria-describedby="nt"`.
- Services: `.pan[data-svc="0..3"]` > `button.ph` + `.pb` > `canvas[data-stage]`. Active = `.pan.on`;
  inactive `.pb` carries `hidden`. `logic.stage.current` = stage canvas of the active panel.
- Skills: `button[data-cat="all|build|design|social|video|ai"]`, active gets `.on`. The card's kicker is a count over its
  title: `SKILLS.length` tools ("26 tools", also the static text) over "Everything", "N in this group" over a group.
  ≤820px the group buttons are one sideways-scrolling row with a faded right edge.
- Work cards (static, in `PROJECTS` order): `article.wk[data-scr]` > `.wki.cut` > `.wkc` > `canvas[data-cover="shape"]`
  (an `img` once `image` is set) + `.wkb` > `h3`, `p` (desc), `span.tg` > one `span` per fact (role, type, status; empty
  ones left out), one per line, `a.wkl[href="#work/<id>"]`
  "View <title>", the card's one control; its `::after` covers the card, so the whole card opens it, and the card gets the
  focus ring (`.wk:has(.wkl:focus-visible)`). Cards carry no `id`: the browser's own scroll-to-fragment on a
  `#work/<id>` load would move focus off the open dialog. JS finds a card by its link's `href`.
- Project view: `<template data-ref="modalTpl">` (last child of `#work`, outside `.fxb`) holds `dialog.modal[data-modal]`;
  JS sets its `aria-label` to the project title (not `aria-labelledby` the `h3`, whose text the engine scrambles while the
  dialog opens, so screen readers would hear the glyphs). Cloned into `#work` and `showModal()`ed on open, closed and
  removed on close: the engine reads the mount (`[data-modal]` stops `#work` dissolving, `canvas[data-cover][data-big]` is
  its big cover, drawn only while `#work` is on screen, so opening scrolls `#work` into view instantly behind the dialog,
  but only when it is off screen: above the 64px header or below the viewport; a card click never moves the page).
  Native focus trap, Escape, `::backdrop` (tint + blur); a press and release both outside the dialog's box close it (the
  dialog is the scroller, so a press on its own scrollbar is inside the box; `.mbox` alone would not cover the
  scrollbar); `html:has(.modal[open])` stops the page scrolling, and `html` carries the theme's background and
  `color-scheme`, so the stable scrollbar gutter matches the page. Inside: `.mvid` > big cover (or `img`,
  `object-fit: contain`), `.mtop` > `h3[modTitle]` + close
  `button[data-act=closeModal][autofocus]`, `p[modDesc]`, `p[modMore]`, `dl.mdl[modFacts]` (Role / Type / Tools / Status
  rows built by JS, empty ones skipped), then `.mlk` links (JS, after the `dl`).
- Project URLs: `#work/<id>` opens that project (`hashchange` → `route()`), so clicking a card or hero link pushes an
  entry and Back closes it. A close by button, Escape or backdrop restores `#work`: `history.back()` when the entry
  below is `#work` (opened from `#work`), else `replaceState('#work')`, so no `#work` entries pile up.
  Loading `#work/<id>` (a shared link, or a reload with a project open) opens it on that entry and writes no history
  before the visitor acts: Chrome's back-button intervention skips entries pushed without a user gesture, so a pushed
  `#work` under it would send Back off the site anyway. Closing it replaces the hash with `#work`; Back from there
  leaves, as from any landing page. On every close, focus goes to that project's card link (the opener for card opens),
  which scrolls it into view if it is off screen.
- Contact: `h2`, "Tell me what it is…", `.ctm` = the Messenger `a.btn` (only primary) + reply/availability `p`
  ("I reply within two hours, Philippine time (UTC+8)." / "Taking freelance and part-time projects now."); `.cta` row =
  `.eml` (mailto link showing the address + ghost `Copy` button, `copyEmail`: clipboard, else selects the address; the
  button's text scrambles like any `[data-scr]`, so it isn't the live region: `span.vh[data-nofx][aria-live=polite]`
  after it gets "Copied", cleared with the button's label after 2 s) then
  ghost `.sm` LinkedIn, Instagram, GitHub (≤1000px the email row stands alone and the three share the next row; ≤520px
  one row each, so none is left alone); `p.lab` "Follow INKWILD" + `a.lnk` TikTok / YouTube (`.lab .lnk` = ink).
  The tide canvas stays at the bottom of `#contact`; the copyright/back-to-top row is the `footer` after `main`.
- `.fbo [hidden]{display:none!important}` exists because layout rules out-rank the UA `[hidden]` rule.

## Run

- `npm run dev` (5173) · `npm run build` → `dist/` · `npm run preview` · `npm test` (node --test, no deps; engine + data tests)
- No env vars and no secrets in the client; `.env` / `.env.*` stay gitignored.
- Supabase (CLI v3 via `npx --yes supabase@latest`; project ref `lsuqyuelsxcawfvbfbmu`, linked, link state in gitignored
  `supabase/.temp`) now only holds `chat_logs` + its views and cron job. Database commands need `--remote`
  (`migration list --remote`, `db query --remote --read-only`).
- Supabase backend for the chat removed 2026-11-15: `ask` edge function deleted, `GROQ_API_KEY` and `ALLOWED_ORIGIN`
  unset (no custom secrets left). `chat_logs` + its views and 180-day cron job stay by the owner's choice.

## Decisions / dead-ends

- Canonical, `og:url`, `og:image`, JSON-LD `url` (ProfilePage and its Person), `public/sitemap.xml` and the robots `Sitemap:` line are hardcoded to
  `https://febrielportfolio.vercel.app/` (an env placeholder once shipped as a literal). Change all seven (five in
  `index.html`, one each in `public/sitemap.xml` and `public/robots.txt`) if the domain changes.
- Palette fixed to Tidal Orchid; the other two palettes stay in CSS (class swap on root) — design tweak, not UI.
- Design-tool tweak props (glyph, rain, light, motion) are constants in `main.js`.
- 2026-11-15: AI chatbot ("Ask my avatar", Groq via the Supabase `ask` function, rating thumbs) removed from the site and
  the code (owner's decision). The avatar's knowledge is kept outside the repo. The `chat_logs` table stays in Supabase by
  the owner's choice; the migration files are its record.
- Primary CTA = Facebook Messenger `https://m.me/febriel.otud.186` (hero, sticky header, contact), new tab. Messenger leads
  because Philippine visitors prefer chat (research in the untracked `research_notes/`, excluded via `.git/info/exclude`). Email, Instagram, LinkedIn,
  GitHub are secondary; INKWILD follow links (TikTok, YouTube) tertiary. "I reply within two hours" sits next to both CTAs.
- Hero (2026-11-15, "cluttered" before): 4 elements — name, value line (brand-plan positioning), one supporting line,
  two buttons — plus the portrait. Coordinates + live clock line dropped. Name: Gambetta 300, two lines at every width
  since 2026-11-18 (owner: "Febriel" over the orchid italic "B. Otud"), `clamp(56px,8vw,128px)`, `nowrap` so the ASCII
  decode can't rewrap a line (no CLS). Name parallax removed; portrait tilt kept (hover reveal and pin removed later the same day, see `engine.js`).
  Pointer ASCII light radius 64px and section glow 280px (2026-11-15, owner: smaller); the glow rests at the section's
  top edge (`--my` 0%) until the pointer moves it, so untouched sections and phones keep a faint top glow.
  Portrait `min(560px,58vh,40vw)` since 2026-11-18 (owner: bigger; 522px at 1440×900, was `min(400px,42vh,34vw)`),
  320px max ≤820px.
- Work as proof (2026-11-15, owner + research report P0-4): five projects, brand plan's three first: PilaPass, The Sev
  Clinic, INKWILD, Invex, KONSEPTO Events. The "Private client" card is folded into the content/motion service text
  ("…including ongoing video editing for a private client"). No "Play" anywhere and no `video` field (removed with the
  "[VIDEO GOES HERE]" placeholder; if a reel comes, add it as a field like `image`). Project images come later from the
  owner (set `image` in `data.js`). No prices on the site. Card meta stays inside the owner's words: INKWILD's role
  "Animation, narration and sound" is his own design copy ("Design system, animation, narration, sound" in
  `design/Main.dc.html`); Invex is "Team project · Full-stack inventory system · School project, not live", since his
  own role on it isn't stated (full-stack describes the system, the team built it). On the cards each fact is its own
  line (2026-11-18, Hallmark 63: no middle-dot strings).
- Hero (2026-11-15, second pass): 5 text elements (name, offer line in Gambetta 400, supporting line "Taking freelance
  and part-time projects now. Remote, or on-site in Dipolog and Dapitan. I reply within two hours.", both buttons, proof
  line under them). Messenger button measured at y 462–518 on 375×812 (fold 812); 443–499 after the type scale;
  439–491 after 2026-11-18 (52px buttons).
- Copy pass (2026-11-15, P2-12): each fact once. "Dipolog City" only in the About "Based in" tile (the hero says the
  Dipolog and Dapitan area); student status (third-year BS Information Systems, JRMSU Main Campus, Dapitan City,
  graduating 2028) only in the About paragraph; The Sev Clinic only in Work (About's "Currently" and "Studying" tiles
  dropped); AI stated in the About tile, the Skills group, and inside INKWILD's project view (marquee keeps its word).
  Hints describe content: "Four things. Most projects end up needing two or three of them." / "Pick a group to see its
  tools." / "Open a project for the details." "Taking freelance and part-time projects now." and the two-hour reply sit
  beside both Messenger buttons.
- No analytics (owner's decision): no page analytics, no cookies → no consent banner. If ever wanted: a cookieless one
  (Plausible / CF Web Analytics).
- Docker not needed: Supabase is hosted.
- Caching (2026-11-15, P1-10): `vercel.json` headers. `/assets/(.*)` (Vite-hashed) `public, max-age=31536000, immutable`;
  `/fonts/(.*)` and `/img/(.*)` (not hashed, replaced in place) `public, max-age=86400, stale-while-revalidate=604800`;
  everything else Vercel's default. Format: https://vercel.com/docs/project-configuration/vercel-json#headers (`$schema`
  set). A changed font or image can stay cached for a day; rename the file if it must show at once.
- Font preloads: the four faces the first screen paints with (Gambetta roman and italic, Geist Mono, Switzer), each href
  identical to its `@font-face` src (checked on the build: one request per font, no unused-preload warning).
- Share image and icons (2026-11-15, P2-13): `public/og.png` 1200×630, 138 KB (logo, name with the orchid italic surname,
  offer line, the ASCII bust drawn by `engine.js`); `og:image` with width/height/alt, `twitter:card` summary_large_image.
  `favicon.svg` kept; `favicon.ico` (16 + 32 PNG entries), `apple-touch-icon.png` (180, full bleed),
  `manifest.webmanifest` (name, short_name, start_url, the SVG and 180 icons, theme/background #08191D). The PNGs were
  rendered with headless Chrome in Geist Mono (the SVG falls back to the system mono); og.png from a scratch page that runs
  `startEngine` with only `avatar` set, under `--force-prefers-reduced-motion` (still bust). Regenerate the same way if
  the hero or the mark changes. JSON-LD is a ProfilePage around the Person; Facebook in `sameAs` is
  https://www.facebook.com/febriel.otud.186.
- Hero spacing (2026-11-15; 2026-11-18): `.nm` has no bottom margin, `.hc` gap 16px, `.hero-cta` margin-top 8px. With
  the two-line name and the 522px bust the hero is 714px tall at 1440×900, centred on the bust; the marquee starts at
  y 778 and Work below the first screen (owner accepted losing the Work peek).
- Hallmark pass (2026-11-18): every [SAFE] item of `reports/Hallmark audit.md` except the copy trims (a proposal in
  `reports/copy-trim.md`, waiting for the owner) and the stamp, plus the owner's six [IDENTITY] picks: sentence-case
  labels, the orchid italic only in the surname ("all three." and "building?" roman; the About statement is now the
  section's `h2`), one hover effect per work card, the bigger bust, the surname on its own line, About on the band
  (`--band` = `color-mix(in oklab, --bg, --bg2)`: #0A2025 dark, #E6E1D1 light; lowest text contrast on it 5.03:1).
  Also: em dashes out of the titles, marquee pauses on hover, caret stops after five blinks, solid phone menu, no hover
  lift on buttons, 52px buttons, curly apostrophes. The waivers and what stays open (Floor 18 / WCAG 2.2.2 by the owner's
  no-pause decision) are in `DESIGN.md`. sloplint static: 77 FAIL / 30 REFLEX / 8 WARN → 53 / 1 / 7 (50 of the 53 are
  the palette blocks, which sloplint can't read as a theme block).
- Still open from P1-10: `avatar-map.png` is fetched twice on a first visit (CSS mask and engine image use different
  request modes; cached afterwards); glyph atlas or OffscreenCanvas; a Lighthouse run and a mid-range Android check.

## Hallmark (design skill, local)

- Installed for this project only at `.claude/skills/hallmark/` (Hallmark v2.0.0, MIT, `github.com/Nutlope/hallmark` at
  `04977e15`), kept out of git by `.git/info/exclude`; no hooks. It runs here only when named: `/hallmark audit
  index.html` (a report), `/hallmark redesign index.html polish`. It reads `DESIGN.md` first, which locks the system, so
  a run keeps the ASCII identity and the waivers. Never run its `install*.mjs`, `lint-hook.mjs` or `imagegen.mjs` (global
  settings, a hook, a paid image API).
- Static lint: copy `index.html` and `src/styles.css` into one scratch folder, change the stylesheet link to
  `href="styles.css"` (sloplint resolves `/src/...` against the filesystem root), then
  `node .claude/skills/hallmark/scripts/sloplint.mjs <copy>/index.html <copy>/styles.css --genre atmospheric`. The
  render tier (`--render`, `--url http://localhost:5173/`) needs `puppeteer-core`, which is not installed.
- The last audit and its evidence: `reports/Hallmark audit.md`, `reports/hallmark-audit/` (git-ignored).

last Claude session: 2026-11-18 16:21
