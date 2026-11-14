# Portfolio — Febriel B. Otud

One-page ASCII portfolio. Source of truth for look and behaviour: `design/Main.dc.html`
(Claude Design canvas export, artifact `6NeXsueHHaZ59dNx7zeXTw`). `design/Brand.dc.html` = brand plan.

## Architecture (and why)

- **Vite + vanilla HTML/CSS/JS. No framework, no TypeScript.** The page is one static document
  plus one canvas engine; state is ~8 fields. Static markup in `index.html` = full content
  without JS (SEO, no hydration). Trade-off: no component model. If a second page/blog
  appears, move to Astro and keep `src/engine.js` as-is.
- **Coding rules: ponytail** (`~/.claude/plugins/marketplaces/greenpt/bench/variants/ponytail.md`).
  Stdlib/native first, fewest files, `ponytail:` comment on every intentional shortcut.
- `index.html` — all markup, copied from the design template. Inline styles kept verbatim on purpose
  (diffable against the design).
- `src/styles.css` — the design's `<helmet><style>`, verbatim, fonts/images repointed to `/fonts`, `/img`.
- `src/engine.js` — the design's canvas engine (lines 451–1274), near-verbatim. Do not restyle it;
  port fixes only. `startEngine(logic)` → `{ sync, stop }`.
- `src/data.js` — `SKILLS`, `GROUPS`, `PROJECTS` (set `video` per project here; optional `links: [[label, url], …]`).
- `src/main.js` — state + DOM glue; replaces the design's `Component` class. Builds the `logic`
  object the engine expects.
- `supabase/functions/_shared/facts.js` — `FACTS`, `FALLBACK`, `PROMPT`, `localAnswer`. Single
  source for the avatar's knowledge; imported by both the browser and the edge function.
- `supabase/functions/_shared/validate.js` — `validate` (ask: `q`, `history?`, `sid?` uuid, `ref?` bare hostname; unknown
  keys refused), `validateRating` (exactly `{ id: uuid, rating: 1|-1 }`), `HOST`, `ROLES`, `MAX_HISTORY`/`MAX_TEXT`; plain JS,
  imported by the edge function, `main.js` and the tests (`validate.test.js` next to it).
- `supabase/functions/ask/index.ts` — Grok (xAI) proxy. Key stays server-side. Fails closed on Origin; 411 without
  content-length; per-IP 10/min + per-isolate 300/hour limits (in memory). One endpoint, two shapes: ask → `{ text, id }`
  and writes one `chat_logs` row per xAI call; `{ id, rating }` → PATCH that row (only while `rating` is null) → `{ ok: true }`.
  Writes are plain `fetch` to PostgREST with the injected secret key, after the reply (`EdgeRuntime.waitUntil`); a failed
  write only logs its status.
- `supabase/migrations/*_chat_logs.sql` — `chat_logs` (RLS on, no policies, revoked from anon/authenticated), dashboard
  views `chat_daily` / `chat_review` / `chat_top_questions` (security_invoker), pg_cron job `chat-logs-retention` (180 days).

## Engine ↔ app contract

Engine reads only: `logic.{root,tilt,avatar,stage,globe,tide,photo,skl,deck}.current`,
`logic.state.{dark,svc,pin,busy,cat,modal,time}`, `logic.props.{mode,motion,rain,light,glyph,reveal}`,
and calls `logic.setState({ time })`. App calls `eng.sync()` after every state change.

## DOM contract (index.html ↔ main.js)

- Root `div#top.fbo.pal-tidal.is-dark[data-ref="root"]`; mode = swap `is-dark`/`is-light` (also sets `meta[name=theme-color]` to `--bg`).
  Hero through contact (incl. marquee) sit in `main#main`; skip link targets `#main`.
  Persisted in `localStorage['fbo-mode']` = `dark|light`, written only on an actual toggle; inline script after the root tag applies it pre-paint.
- Refs: `[data-ref="…"]` — `tilt avatar globe tide photo skl deck work log askInput askForm send menu catRows modalTpl`.
- Text bindings: `[data-bind="…"]` — `modeLabel time catKicker catTitle`; in modal: `modTitle modDesc modTags`.
- Actions: `[data-act="…"]` — `toggleMode toggleMenu closeMenu togglePin focusAsk deckPrev deckNext closeModal`.
- Services: `.pan[data-svc="0..3"]` > `button.ph` + `.pb` > `canvas[data-stage]`. Active = `.pan.on`;
  inactive `.pb` carries `hidden`. `logic.stage.current` = stage canvas of the active panel.
- Skills: `button[data-cat="all|build|design|social|video|ai"]`, active gets `.on`.
- Chat chips: `button[data-q]`. Log shows last 2 messages; rows built by JS, greeting pre-rendered.
- Rating: built by JS at the end of the latest answer that has a server `id` — `span[role=group][data-nofx]` >
  `button.icb.rt` ×2 (`aria-label` Helpful / Not helpful, `aria-pressed`, `aria-disabled` + `.on` after the vote, then "Thanks.").
  `.rt` in styles.css = 32px button with a 44px `::after` hit area. Message objects carry `id` and `rating`.
- Work cards: `button.wk[data-open="N"]` (N = `PROJECTS` index), canvas `data-cover="shape"`.
- Modal: `<template data-ref="modalTpl">` (last child of `#work`). Cloned in on open, removed on
  close — engine relies on mount/unmount. While open, `#work .wrap` is `inert`. Inside: `.modal[data-modal]`, `[data-ref="mclose"]`,
  `video[data-ref="vid"]`, and `[data-novideo]` on the cover canvas (`data-big="1"`) and its label. A project's `links` are
  built by JS right after `modTags` (no hook): a flex row of `a.btn.ghost.sm[data-scr][target=_blank][rel=noopener]` + arrow icon.
- `.fbo [hidden]{display:none!important}` exists because layout rules out-rank the UA `[hidden]` rule.

## Run

- `npm run dev` (5173) · `npm run build` → `dist/` · `npm run preview` · `npm test` (node --test, no deps)
- Env: `VITE_ASK_URL` = deployed `ask` function URL. Production builds read it from the committed `.env.production`
  (public config only, never secrets; the one env file un-ignored in `.gitignore`). Dev reads ignored `.env`/`.env.local`
  (see `.env.example`); unset → avatar answers from `localAnswer` only (dev default).
- Edge function secrets (Supabase, never in repo): `XAI_API_KEY`, optional `XAI_MODEL`, `ALLOWED_ORIGIN` (comma-separated;
  unset → every browser request gets 403; local dev needs `ALLOWED_ORIGIN=http://localhost:5173`). `SUPABASE_URL` and
  `SUPABASE_SECRET_KEYS` (falls back to legacy `SUPABASE_SERVICE_ROLE_KEY`) are injected by Supabase — don't set them.
- Deploy (Supabase CLI v3 via `npx --yes supabase@latest`; project ref `lsuqyuelsxcawfvbfbmu`, already linked, link state in
  gitignored `supabase/.temp`): database commands need `--remote` — `db push --remote` (chat_logs migration),
  `migration list --remote`, `db query --remote --read-only`. Functions deploy without Docker via `--use-api`:
  `npx --yes supabase@latest functions deploy ask --no-verify-jwt --use-api`.
  Chat stats: dashboard SQL editor / table editor on the three views. Under `supabase functions serve`, log writes after the
  reply need `[edge_runtime] policy = "per_worker"` in config.toml (hosted runtime doesn't).

## Decisions / dead-ends

- Canonical, `og:url`, JSON-LD `url`, `public/sitemap.xml` and the robots `Sitemap:` line are hardcoded to
  `https://febrielportfolio.vercel.app/` (an env placeholder once shipped as a literal). Change all five if the domain changes.
- Palette fixed to Tidal Orchid; the other two palettes stay in CSS (class swap on root) — design tweak, not UI.
- Design-tool tweak props (glyph, reveal, rain, light, motion) are constants in `main.js`.
- Chat is non-streamed + typed out client-side: same feel as the design, a fraction of the code.
- No page analytics, no cookies → no consent banner. Chat analytics are server-side rows (question, answer, timing,
  tokens, referrer domain, rating), disclosed in the note under the chat; the session id is a per-page-load uuid kept in
  memory only. "Unanswered" = answer contains "on file" (heuristic, matches the system prompt's wording).
  Page analytics, if wanted: a cookieless one (Plausible / CF Web Analytics).
- Docker not needed: Supabase is hosted, set up later by Febriel.
- Avatar says only what Febriel has shared (his rule): `PROMPT` forbids guessing or filling gaps; new facts come from him,
  first person, one to three short sentences. `localAnswer` matches keywords at word starts (a trailing space in a keyword =
  whole word, e.g. `'live '`); routes are pinned by `src/chat.test.js`.

last Claude session: 2026-11-14 12:08 (Asia/Manila)
