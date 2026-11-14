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
- `src/data.js` — `SKILLS`, `GROUPS`, `PROJECTS` (set `video` per project here).
- `src/main.js` — state + DOM glue; replaces the design's `Component` class. Builds the `logic`
  object the engine expects.
- `supabase/functions/_shared/facts.js` — `FACTS`, `FALLBACK`, `PROMPT`, `localAnswer`. Single
  source for the avatar's knowledge; imported by both the browser and the edge function.
- `supabase/functions/_shared/validate.js` — `validate`, `ROLES`, `MAX_HISTORY`/`MAX_TEXT` for the `ask` request; plain JS,
  imported by the edge function, `main.js` and the tests.
- `supabase/functions/ask/index.ts` — Grok (xAI) proxy. Key stays server-side. Fails closed on Origin; 411 without
  content-length; per-IP 10/min + per-isolate 300/hour limits (in memory).

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
- Work cards: `button.wk[data-open="N"]` (N = `PROJECTS` index), canvas `data-cover="shape"`.
- Modal: `<template data-ref="modalTpl">` (last child of `#work`). Cloned in on open, removed on
  close — engine relies on mount/unmount. While open, `#work .wrap` is `inert`. Inside: `.modal[data-modal]`, `[data-ref="mclose"]`,
  `video[data-ref="vid"]`, and `[data-novideo]` on the cover canvas (`data-big="1"`) and its label.
- `.fbo [hidden]{display:none!important}` exists because layout rules out-rank the UA `[hidden]` rule.

## Run

- `npm run dev` (5173) · `npm run build` → `dist/` · `npm run preview` · `npm test` (node --test, no deps)
- Env (`.env`, see `.env.example`): `VITE_ASK_URL` = deployed `ask` function URL. Unset → avatar
  answers from `localAnswer` only.
- Edge function secrets (Supabase, never in repo): `XAI_API_KEY`, optional `XAI_MODEL`, `ALLOWED_ORIGIN` (comma-separated;
  unset → every browser request gets 403; local dev needs `ALLOWED_ORIGIN=http://localhost:5173`).

## Decisions / dead-ends

- No canonical / og:url / JSON-LD `url` yet: domain unknown, and an unset `%VITE_SITE_URL%` shipped as a literal.
  Add them back (hardcoded absolute URL) at deploy.
- Palette fixed to Tidal Orchid; the other two palettes stay in CSS (class swap on root) — design tweak, not UI.
- Design-tool tweak props (glyph, reveal, rain, light, motion) are constants in `main.js`.
- Chat is non-streamed + typed out client-side: same feel as the design, a fraction of the code.
- No analytics, no cookies → no consent banner. Add a cookieless one (Plausible / CF Web Analytics) at deploy.
- Docker not needed: Supabase is hosted, set up later by Febriel.
