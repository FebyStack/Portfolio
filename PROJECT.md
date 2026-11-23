# Portfolio — Febriel B. Otud

One-page ASCII portfolio. See `DESIGN.md` for the current composition, type and motion rules.
The original design and brand direction are archived in `design/Main.dc.html` and `design/Brand.dc.html`.
Use the owner's project facts and copy. Treat walkthroughs as illustrations of supported flows.

## Architecture

- Vite serves one static HTML document with vanilla CSS and JavaScript. `index.html` supplies the
  portfolio copy and work art. `src/styles.css` owns the palette, type, grid and responsive styling.
- `src/data.js` defines `SKILLS`, `GROUPS`, `PROJECTS`, and the `projectAt(hash)` lookup.
  Keep project IDs stable and duplicate each project title and description in the static HTML.
  Set a project's `image` and `alt` together to use a screenshot in the list and dialog.
- `src/main.js` owns theme, mobile menu, active service, active skill group, dialog and clipboard feedback.
  `index.html` applies the saved theme or OS preference before paint. Theme changes update the
  corresponding root class and theme color. The mode choice is stored in `localStorage['fbo-mode']`.
- The site does not use the Supabase chat backend. `supabase/migrations/` records its retained database
  objects and permissions for maintenance.

## Canvas engine

`startEngine(logic)` returns `sync()` and `stop()`. It reads the root and canvas refs, plus
`logic.state.{dark,svc,cat}`. The app calls `sync()` after state changes and the engine never writes app state.

- Portrait pixels come from `public/img/avatar-map.png`, a 264×264 density map traced from the INKWILD
  drawing. The `data-ref="avatar"` canvas renders the print and plays a short reveal once. The portrait
  ink responds to pointer position and returns to a still highlight when the pointer leaves.
- The active `canvas[data-stage]` and `data-ref="globe"` accept drag. Selection moves them to the
  chosen service shape or skill group. Reduced motion skips interpolation and inertial rotation.
- `photo.webp` loads as About approaches and the canvas blends its edges into ASCII. The tide is static.
  Each canvas has a maximum backing store of 4.19M device pixels. The engine only draws near the
  viewport and logs failures per layer.

## DOM and navigation

- The main section IDs are `work`, `services`, `skills`, `about` and `contact`. Keep them stable.
  At 820px and below the nav moves to the mobile menu, which closes on selection, Escape, or widening.
  `scroll-padding-top` keeps anchors and keyboard focus clear of the sticky header.
- The work list is `.works.g12`. Each `.wk` has one `.wkl` project link whose hit area covers the row.
  `.wkc` contains the queue walkthrough or one of the static plates. The dialog clones the same media.
- Opening `#work/<id>` uses the native modal dialog. Back closes a dialog entered from `#work`.
  The Close button, Escape or backdrop restore `#work` without adding a redundant history entry.
  A direct project URL leaves the session history alone until the user acts. Closing a project returns
  focus to its link.
- Service buttons expose `aria-expanded` and `aria-controls`. Skill buttons expose `aria-pressed`
  and emphasize the active group in both the globe and the full tools index. At 820px and below the
  controls sit above the globe.
- The Copy button writes the address to the clipboard. When clipboard access fails, it selects the
  address and announces the keyboard alternative in the live region. New-tab links share the
  `aria-describedby="nt"` hint.

## Run

- `npm run dev` (5173) · `npm run build` → `dist/` · `npm run preview` · `npm test` (node --test, no deps; engine + data tests)
- No env vars and no secrets in the client; `.env` / `.env.*` stay gitignored.
- Supabase (CLI v3 via `npx --yes supabase@latest`; project ref `lsuqyuelsxcawfvbfbmu`, linked, link state in gitignored
  `supabase/.temp`) now only holds `chat_logs` + its views and cron job. Database commands need `--remote`
  (`migration list --remote`, `db query --remote --read-only`).
- Supabase backend for the chat removed 2026-11-15: `ask` edge function deleted, `GROQ_API_KEY` and `ALLOWED_ORIGIN`
  unset (no custom secrets left). `chat_logs` + its views and 180-day cron job stay by the owner's choice.

## Historical decisions

- Canonical, `og:url`, `og:image`, JSON-LD `url` (ProfilePage and its Person), `public/sitemap.xml` and the robots `Sitemap:` line are hardcoded to
  `https://febrielportfolio.vercel.app/` (an env placeholder once shipped as a literal). Change all seven (five in
  `index.html`, one each in `public/sitemap.xml` and `public/robots.txt`) if the domain changes.
- Palette fixed to Tidal Orchid; the other two palettes stay in CSS (class swap on root) — design tweak, not UI.
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
  lift on buttons, 52px buttons, curly apostrophes. This pass preceded the removal of the marquee, ambient loops and text scramble. sloplint static: 77 FAIL / 30 REFLEX / 8 WARN → 53 / 1 / 7 (50 of the 53 are
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
