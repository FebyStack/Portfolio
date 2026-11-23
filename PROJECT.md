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
- `index.html` — all markup. Since the 2026-11-19 editorial redesign it has no inline styles: every rule is a class in
  `styles.css` (the design template's inline styles went with the old layout).
- `src/styles.css` — rewritten 2026-11-19 for the editorial system (12-column `.g12` grid, opening rules, captions, the
  `.sep` ASCII band, the `--mark` vermilion; `DESIGN.md` has the grid, scale and every composition). Kept from before:
  `:root` holds the colours `html` paints itself (page background, `scrollbar-color`) and the Tidal blocks reuse them;
  `html, body` clip overflow-x; spacing on a 4px scale; labels and controls in sentence case; print shows every
  section.
  - Type scale: every text size is a token on `.fbo` (`--fs-xs` … `--fs-name`, plus `--fs-title` and `--fs-display`
    since 2026-11-19); the list and their uses are in `DESIGN.md`. `text-wrap: balance` on h1–h3 and short blocks,
    `pretty` on paragraphs. Labels and controls sentence case, tracked 0–0.03em; only the marquee keeps capitals.
- `src/engine.js` — the design's canvas engine (lines 451–1274), near-verbatim except the section reveal and the portrait below.
  Do not restyle it; port fixes only. `startEngine(logic)` → `{ sync, stop }`.
  - Section reveals play once (2026-11-19, owner; replaced the 2026-11-15 dissolve/replay): `inView()` (tested)
    reveals a `[data-sec]` the first time 160px of it is on screen (a third of the section or of the viewport when that
    is less, so it can always get there): veil 1 → 0, text decode (`decode(el, 950)`), hero portrait and about photo
    intros from 0. After that the section stays as it is in both scroll directions: no dissolve, no replay (the exit
    hysteresis, `hide()`, reversed decode and reversed intros were deleted). The section observer's `rootMargin` drops
    the strip under the sticky header (its height, read once at start), so "on screen" means below the header. A
    section's height is pinned for 1.5 s while its text decodes (scrambled glyphs rewrap on phones); `sync()` drops pins
    since app changes win. `focusin` reveals a not-yet-revealed section. The decode (reveal, hover, dialog, skills)
    never scrambles text inside the focused element (`named()`: it is a control's accessible name), also when focus
    arrives mid-decode. Reduced motion: unchanged (content always visible, no veil/decode); switched on after load, the
    `@media print,(prefers-reduced-motion:reduce)` rule shows sections still waiting. Checked 2026-11-19 (headless Chrome, 1440×900 and 375×812): each section reveals once on
    the first pass down; two more round trips keep every section at opacity 1 with its original text; nothing stuck
    after fast scrolling or `#contact` / `#work/invex` loads; no console errors. Since 2026-11-18 the
    first screen ends exactly on the marquee at both 1440×900 and 1920×1080, so nothing sits half-revealed; Work
    reveals on the first scroll.
  - About photo (2026-11-15, P1-10): fetched by a one-shot IntersectionObserver once the photo canvas is within one
    viewport of the screen (`rootMargin` 100% at the bottom), not at startup (first request at scrollY 1440 of 3880 on
    1440×900).
  - `ponytail:` note in `frame()`: every layer draws with `fillText`; ceiling about 3–7 ms per draw on a fast Mac.
    Upgrade path: a glyph atlas or an OffscreenCanvas worker (not done). Each layer draws inside its own `run()` try
    (2026-11-19), so one layer throwing logs once (`fbo engine: <layer>`) and the others keep drawing.
  - Hero portrait (2026-11-15, owner): ASCII only, a head-and-shoulders bust. The hover/tap ink reveal and its
    "Show the drawing" pin are gone; the 3D tilt and the pointer accent (a small accent-glyph cloud at the pointer,
    drifting on its own when nobody points) stay.
  - Work covers (2026-11-18, owner: one hover effect per card): hovering a card no longer speeds its cover up or draws it
    every frame; the card's hover is the text scramble. Only the project view's big cover turns faster. Since
    2026-11-19 each cover canvas is observed by the layer `io` (only on-screen covers draw, one per frame round-robin)
    and its glyph grows with it (`w / 60`, min 9; stage `w / 40`, min 12), so the bigger illustrations cost about what
    the old cards did.
  - 2026-11-19: `scrollFx` (the deck arc `--o` and the scroll parallax `--sp`) and the pointer `--px/--py` vars were
    deleted with the layouts that used them; the hero tilt stays. The ambient rain canvas draws at DPR 1 (`ponytail:`
    note in `drawAmbient`).
  - Canvas memory, iOS rule (2026-11-19, after Safari's "A problem repeatedly occurred" on the owner's iPhone with the
    redesign): budget about 32 MB of live canvas backing store on a 390×844@3 phone (measured 18–23 MB; the pre-redesign
    `55d25cf` 16–23 MB; the redesign before the fix 27.5–32 MB, every section's rain canvas kept once shown). Rules: (1) no
    canvas backs more than `MAX_PX` 4.19M device px (16 MB, a quarter of WebKit's 16.7M per-canvas cap): `backing()`
    (tested) lowers its DPR past that; caps stay 2 for the objects, 1.5 covers, 1 rain. (2) A section more than a screen
    away frees its section-sized rain canvas (`far` observer, `width = 0`); the reveal-once change had deleted the old
    free-on-dissolve, which is what kept them all. The screen of margin means Safari's toolbar (±80px) never frees and
    rebuilds one at an edge; canvases only resize when their CSS size changes, and nothing is sized in `dvh`. (3) No CSS
    `mask` on a canvas or a section-sized layer: WebKit gives the masked layer a second full-size backing store at the
    screen's scale. The rain's fade over text is drawn in the canvas (`ambMask`, tested, `destination-in`). Measured in
    headless Chrome with iPhone emulation (scratch CDP scripts, not in the repo); only a real iPhone confirms WebKit.
- `public/img/avatar-map.png` — the portrait's density map, 264×264 RGBA read by `buildAvatar`: channel 0 = tone,
  1 = accents (only hair uses them, dark mode), 2 = hair flag (low = hair: dark mode gives it a minimum density),
  alpha = subject mask. Built once (scratch script, not in the repo) from the
  head-only map of `26a4b8f` (traced from the INKWILD ink drawing): head scaled 0.75 into the top two-thirds, neck
  continued from its row 238, shoulders and V-neck t-shirt from `photo.webp`'s alpha (skin = warm pixels), shirt tone
  ≈0.5 from the photo's luminance (lighter mass than the face in dark mode, darker in light mode), 6px soft edges, a
  rounded vignette fading shoulders and bottom to dots. `public/img` also holds `photo.webp` (About photo);
  `avatar-ink.webp` was deleted with the reveal.
- `src/data.js` — `SKILLS`, `GROUPS`, `PROJECTS` (card order; fields `id title shape desc role type status more tools
  image alt`, optional `links: [[label, url], …]`) and `projectAt(hash)` (`#work/<id>` → index, else -1).
  Screenshots later = set `image` (+ `alt`) here only: it replaces the ASCII cover on the card and in the project view.
  `src/data.test.js` checks the hash mapping, that each card in `index.html` repeats its title and desc, and that the
  skills card's static kicker is `SKILLS.length` tools.
- `src/main.js` — state + DOM glue; replaces the design's `Component` class. Builds the `logic`
  object the engine expects.
- `supabase/migrations/*_chat_logs.sql` — record of the `chat_logs` table that stays in the hosted database after the
  chatbot's removal: RLS on, no policies, revoked from anon/authenticated; views `chat_daily` / `chat_review` /
  `chat_top_questions` (security_invoker); pg_cron job `chat-logs-retention` (180 days). `*_chat_logs_unanswered.sql` adds
  the `unanswered` column. Nothing in the site reads or writes it any more.

## Engine ↔ app contract

Engine reads only: `logic.{root,tilt,avatar,stage,globe,tide,photo,skl}.current`,
`logic.state.{dark,svc,cat,modal}`, `logic.props.{mode,motion,rain,light,glyph}`, and never writes app state (the
design's 20 s clock with its `time`, and the avatar's `busy`/"speaking", went with the chatbot). App calls `eng.sync()`
after every state change; `sync()` also drops the sections' height pins, so nothing should call it on a timer.

## DOM contract (index.html ↔ main.js)

- Root `div#top.fbo.pal-tidal.is-dark[data-ref="root"]`; mode = swap `is-dark`/`is-light` (also sets `meta[name=theme-color]` to `--bg`).
  `main#main` holds, in order: hero, marquee, `#work`, `div.sep`, `#services`, `div.sep`, `#skills`, `div.sep`, `#about`,
  `div.sep`, `#contact` (nav and mobile menu follow the section order; `.sep` = the static ASCII band, `aria-hidden`, a
  CSS `::before` string). `footer.foot` sits after `main`, inside the root. Skip link targets `#main`. Every section after
  the hero opens with `.hd` > `h2` and an optional hint. Paddings in `DESIGN.md`. The hero
  has a min-height (screen under the header and marquee); the rest size to content. `html{scroll-padding-top:80px}` keeps anchors and keyboard
  focus clear of the 64px sticky header (so `.sec` has no scroll-margin).
  Persisted in `localStorage['fbo-mode']` = `dark|light`, written only on an actual toggle; inline script after the root tag applies it pre-paint,
  and with nothing stored follows the OS (`prefers-color-scheme: light` → light, otherwise the markup's dark default);
  `main.js` keeps following OS changes live (`followOS`) until the visitor toggles.
  `state.dark` reads that class, so script and app agree; `render` then sets `theme-color`. The theme pill's `aria-label`
  starts with its visible word (WCAG 2.5.3): "Dark mode, switch to light" / "Light mode, switch to dark".
- Refs: `[data-ref="…"]` — `tilt avatar globe tide photo skl work menu catRows modalTpl`.
- Text bindings: `[data-bind="…"]` — `modeLabel catKicker catTitle`; in the project view: `modTitle modDesc modMore modFacts`.
- Actions: `[data-act="…"]` — `toggleMode toggleMenu closeMenu closeModal copyEmail`.
  Escape with the mobile menu open closes it and focuses the menu button; widening past 820px (where the menu button
  hides) closes it too (`matchMedia`, `data.test.js` checks the JS and CSS numbers match).
- Hero: `.wrap.fxb.g12` holds `.hc` (name, offer, Messenger and “See my work”), `figure.fig.avf` (the portrait
  frame `.av`, tilt canvas and caption), and `.dateline` (availability and recent project links). On narrow widths
  they follow that reading order. The name and offer are static text with `data-nofx`.
- Header CTA: `a.btn.hcta` (same Messenger link) between the theme pill and the menu button; `aria-label` carries the name,
  its `span` label is `display:none` ≤1000px (icon only). ≤360px the theme pill hides its `modeLabel` word so the header fits 320px.
- New-tab hint: hidden `span#nt` ("Opens in a new tab") right after the skip link; every `target=_blank` link (also the
  project view's JS-built `links`) has `aria-describedby="nt"`.
- Services: `.pans` (12-column grid) > `.pan[data-svc="0..3"]` (`display: contents` above 820px) > `button.ph` (`span.pt`
  title) + `.pb` > `.pbt` (text, tags) + `figure.pbc` > `canvas[data-stage]`. Active = `.pan.on`; inactive `.pb` carries
  `hidden`. `logic.stage.current` = stage canvas of the active panel. Mouseenter (on the `.ph`, not the panel), click
  and focus open one.
- Skills: `.skills-grid` holds `.skh` (selected group title, count and buttons), `figure.glf` (globe and caption),
  and `dl.ix[data-ref=catRows]` (static tools in `SKILLS` order). The buttons expose their active state with
  `aria-pressed`. The selected row gets `.on` and the others use muted ink. At ≤820px the controls wrap above the globe.
- Work entries (static, in `PROJECTS` order): `.works.g12` > `article.wk[data-scr]` > `.wkc` > `canvas[data-cover="shape"]`
  (an `img` once `image` is set) + `.wkb` > `h3`, `p` (desc, one line; role, type and status show only in the project
  view), `a.wkl[href="#work/<id>"]` "View <title>", the entry's one control; its `::after` covers the entry, so the whole
  entry opens it, and the entry gets the focus ring (`.wk:has(.wkl:focus-visible)`). Entries carry no `id`: the
  browser's own scroll-to-fragment on a `#work/<id>` load would move focus off the open dialog. JS finds an entry by
  its link's `href`. The first entry is the lead, followed by paired entries that stack on phones (see `DESIGN.md`).
- Project view: `<template data-ref="modalTpl">` (last child of `#work`, outside `.fxb`) holds `dialog.modal[data-modal]`;
  JS sets its `aria-label` to the project title (not `aria-labelledby` the `h3`, whose text the engine scrambles while the
  dialog opens, so screen readers would hear the glyphs). Cloned into `#work` and `showModal()`ed on open, closed and
  removed on close: the engine reads the mount (`canvas[data-cover][data-big]` is
  its big cover; the dialog sits in the top layer, so the cover is on screen and animates from any scroll position, and
  opening never moves the page; the old scroll of `#work` into view was removed 2026-11-19).
  Native focus trap, Escape, `::backdrop` (a 94% page-colour tint, no blur since 2026-11-19); a press and release both outside the dialog's box close it (the
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
- Contact: `.hd` > `h2.cq`; `.ctw.g12` > `.ctm` (`p.lead` "Tell me what it is…", the Messenger `a.btn`, the only
  primary, + reply/availability `p`) and `ul.cta` rows: `li.eml` (mailto link showing the address + ghost `Copy`,
  `copyEmail`: clipboard, else selects the address; the button's text scrambles like any `[data-scr]`, so it isn't the
  live region: `span.vh[data-nofx][aria-live=polite]` after it gets "Copied" (or, when the clipboard is blocked,
  "Address selected. Press Ctrl or ⌘ + C to copy.", which the button also shows, wrapping on phones), cleared with the
  button's label after 2 s), `a.row` LinkedIn, Instagram, GitHub, `li.fol` "Follow INKWILD" + `a.lnk` TikTok / YouTube. `.tide` > the tide
  canvas at the bottom of `#contact`; `footer.foot` = © + Back to top.
- `.fbo [hidden]{display:none!important}` exists because layout rules out-rank the UA `[hidden]` rule.

## State

No state library and no `data-state` attributes (2026-11-19 decision, `reports/State machines.md`): each app machine
is one field of `state` in `main.js`, one branch of `render()`, and an existing DOM mirror that tests and agents read.
Engine machines are one-way: `sync()` (after every `setState`) mirrors `state` into `E.{dark,svc,cat,modal}` and fires
one-shot effects on a change.

| Machine | States | Events | Source of truth | DOM mirror |
|---|---|---|---|---|
| Theme | dark / light; origin stored (`fbo-mode`) or OS | `toggleMode` (stores, `followOS = false`); OS `prefers-color-scheme` change while `followOS` | `main.js` `state.dark` + `followOS`; `index.html` pre-paint | root `is-dark`/`is-light`, `meta[theme-color]`, pill `aria-label` + `modeLabel` |
| Menu | closed / open | `toggleMenu`, `closeMenu` (links), Escape (focus → button), any `hashchange`, widening past 820px | `state.menu` | `[data-ref=menu][hidden]`, `.mnb[aria-expanded]` |
| Services | 0..3 | `.ph` mouseenter / click / focus | `state.svc` (engine morph `sFrom/sTo/sMix`) | `.pan.on`, `.pb[hidden]`, `.ph[aria-expanded]` |
| Skills group | all / build / design / social / video / ai | `button[data-cat]` click | `state.cat` (engine `gMix`, decode of `skl`) | `aria-pressed`, `.on`, `.ix.f`, row `.on`, `catKicker`/`catTitle` |
| Project view | closed / open(i, `onWork`) / closing (transient: dialog closed, hash and `state.modal` still open until the `history.back()` hashchange) | only `hashchange`/load open it; Back or another hash closes; close button / Escape / backdrop → `history.back()` if `onWork`, else `replaceState('#work')`; every close focuses the card link | `state.modal` (-1 or index), `onWork`, `dlg`, `shown` | `location.hash` `#work/<id>`, `dialog.modal[open]` (removed when closed), `history.length` |
| Copy button | idle / copied / selected, 2 s back to idle | `copyEmail` click; clipboard ok or blocked | `copyT` timer in `main.js` | button text, `.eml [aria-live]` text, the selection |
| Section reveal | waiting / revealed (once) / static (reduced motion at load, no JS) | 160px in view (`inView`) or `focusin` | `engine.js` `o.shown` per `[data-sec]` | `[data-sec][data-fx="wait"]` while waiting |
| Text decode | per text node: scrambling → settled; dropped if the app changes the node or it gets focus | reveal, `[data-scr]` pointerover, skills change, dialog open | `engine.js` `fx[]` | the text itself (never inside the focused element) |
| Canvas layers / drag | per layer: visible × pointer outside / inside / down (captured), inertia `vyaw` | pointer events, `hold()` rebinds on `sync()` | `engine.js` `makeLayer` objects `A S Gl Td Ph`, covers' `__fboC` | none (canvas pixels) |
| Intros | portrait `aIntro`, photo `pIntro` 0 → 1 after their section reveals; photo not near → loading → loaded | section reveal, photo within one screen | `engine.js` | none |
| Animation loop | running (rAF, draws at most every 30 ms; paused by the browser in a hidden tab) | — | `engine.js` `frame()`; per-layer `run()` errors in `bad` | none |
| Motion modes | normal / reduced motion (read live) / no JS / print | OS setting, print | `calm` media query in `engine.js`; CSS media rules | `[data-fx]` never set under reduce at load or without JS |

Dead state kept for the engine contract: `logic.props.mode` and `sync()`'s `st.dark == null` branch (`state.dark` is
always boolean), the `heroO.shown` test inside `aIntro`.

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
  Portrait five grid columns, `min(100%,56vh)` since 2026-11-19 (492px at 1440×900; was `min(560px,58vh,40vw)`),
  320px max ≤820px.
- Work as proof (2026-11-15, owner + research report P0-4): five projects, brand plan's three first: PilaPass, The Sev
  Clinic, INKWILD, Invex, KONSEPTO Events. The "Private client" card is folded into the content/motion service text
  ("…including ongoing video editing for a private client"). No "Play" anywhere and no `video` field (removed with the
  "[VIDEO GOES HERE]" placeholder; if a reel comes, add it as a field like `image`). Project images come later from the
  owner (set `image` in `data.js`). No prices on the site. Project meta stays inside the owner's words: INKWILD's role
  "Animation, narration and sound" is his own design copy ("Design system, animation, narration, sound" in
  `design/Main.dc.html`); Invex is "Team project · Full-stack inventory system · School project, not live", since his
  own role on it isn't stated (full-stack describes the system, the team built it). Since the copy trim (2026-11-18,
  owner approved `reports/copy-trim.md` as proposed) a card is its title, a one-line `desc` and its link; role, type
  and status are only the project view's rows, each its own line (Hallmark 63: no middle-dot strings).
- Hero (2026-11-15, second pass; copy trim 2026-11-18): 5 text elements (name, offer line in Gambetta 400, both
  buttons, then the supporting line "Taking freelance and part-time projects now. I reply within two hours." and the
  proof line under them; "Remote, or on-site in Dipolog and Dapitan." moved to the About "Based in" tile). Messenger
  button measured at y 462–518 on 375×812 (fold 812); 443–499 after the type scale; 439–491 after 2026-11-18 (52px
  buttons); 347–399 after the copy trim.
- Copy pass (2026-11-15, P2-12): each fact once. "Dipolog City" only in the About "Based in" tile ("Dipolog City,
  Philippines. Remote, or on-site in Dipolog and Dapitan." since the 2026-11-18 copy trim); student status (the About
  paragraph, "I’m a third-year BS Information Systems student…") removed 2026-11-19 (owner); About is the statement and
  the tiles; The Sev Clinic
  only in Work (About's "Currently" and "Studying" tiles dropped); AI stated in the About tile, the Skills group, and
  inside INKWILD's project view (marquee keeps its word).
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
- Editorial redesign (2026-11-19, owner picked "Editorial poster" after rejecting a 3D zoom-through scroll as too much
  motion and lag): layout, type and composition only, no new motion. 12-column grid, `--fs-display` openers, opening
  rules, a static ASCII band between sections, the ASCII pieces as captioned illustration blocks, one second accent
  (`--mark` vermilion, marks only). Owner, same day: no numbering furniture at all (no "No. 01", "Fig. 1", nav or entry
  numbers). Content unchanged except the footer's portrait line moving to the hero bust's caption and "Hi, I’m
  Febriel" becoming the About photo's caption; the outlined "Febriel" art and disc behind the photo were dropped; the
  deck and its arrows replaced by the feature list. Scripting per rAF frame at 1440×900 (headless, DPR 1), before →
  after: hero 2.25 → 0.6 ms, work 1.78 → 1.3, services 1.74 → 1.2, skills 2.34 → 0.5, about 2.13 → 1.9, contact 2.11
  → 0.4. Page 4957 → about 8000px tall; canvas area at DPR 2 about 21.5M → 19.7M device px (rain at DPR 1). The
  share image `public/og.png` was kept: name, offer line and bust are unchanged.
- Hallmark pass (2026-11-18): every [SAFE] item of `reports/Hallmark audit.md` except the copy trims (applied later the
  same day: `reports/copy-trim.md`, approved as proposed) and the stamp, plus the owner's six [IDENTITY] picks:
  sentence-case labels, the orchid italic only in the surname ("all three." and "building?" roman; the About statement
  is now the section's `h2`), one hover effect per work card, the bigger bust, the surname on its own line, About on the band
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

last Claude session: 2026-11-19
