# Design: Febriel B. Otud portfolio

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.
Owner's decisions and waivers below bind like the rest: a Hallmark run reports them as kept, never "fixes" them.

## System
- Genre: atmospheric (dark default, a generative ASCII canvas in every section)
- Shape of the first page: one page. Hero (name, offer line, actions, proof line beside the ASCII bust), marquee, Work
  (a deck of cards on an arc, a project view per URL), Services (four panels, one open), Skills (a 3D globe and its
  list), About (photo and text on the band), Contact (statement, Messenger, the rest, the tide), colophon footer
- Theme: custom, the Tidal Orchid palette (vibe: "ASCII ink on sea-ink, one orchid signal")
- Axes: dark paper (light by toggle) / light serif display / orchid accent · posture: hero Settled, colour Restrained
- Job: hire one freelancer. The action is a Facebook Messenger chat (hero, sticky header, contact); email and profiles
  come second, the INKWILD channels third

## Tokens
`src/styles.css` is the source of truth: `:root` (what `html` paints), `.fbo` (type, gutter, band),
`.fbo.pal-tidal.is-dark` / `.is-light` (the palette). The roles, in the project's names:
```css
/* dark (default) */
--bg: #08191D;  --bg2: #0D272D;  --band: #0A2025;  --line: #1D3A40;      /* paper, well, About band, rule */
--ink: #E7E2D3;  --mute: #8FA6A4;  --accent: #C2A8FF;  --on-accent: #150B2E;  /* focus = --accent */
/* light */
--bg: #ECE7DA;  --bg2: #E1DBC9;  --band: #E6E1D1;  --line: #C9C2AE;
--ink: #0E2429;  --mute: #4C6163;  --accent: #5B36C9;  --on-accent: #F4F0FF;
/* --band = color-mix(in oklab, var(--bg), var(--bg2)); --grain, --glow, --shade, --bgc derive from the same hues */
--serif: "Gambetta";  --sans: "Switzer";  --mono: "Geist Mono";  /* display / body / the ASCII material */
```
- Contrast (WCAG, lowest pairs): light `--mute` on `--bg2` 4.75:1, on the band 5.03:1; dark `--mute` on the band 6.55:1.
  Any new pair stays at 4.5:1 or more.
- Type scale (`.fbo`): `--fs-xs` 12px mono labels, tags, small links, `dt`, marquee · `--fs-sm` 14px buttons, nav and
  menu links, logo, hints, tool rows, proof line · `--fs-md` 17px Switzer reading text (line-height 1.5, `--measure`
  40ch) · `--fs-lg` clamp(22px, 2.1vw, 30px) offer line, About statement, card, panel and project titles · `--fs-xl`
  clamp(36px, 4vw, 60px) section heads · `--fs-2xl` clamp(40px, 5.6vw, 84px) the contact line · `--fs-name`
  clamp(56px, 8vw, 128px) the name. Weights: Gambetta 300 (the name only) and 400, Switzer 400, Geist Mono 500.
  Labels and controls are sentence case, tracked 0 to 0.03em; the marquee alone keeps capitals.
- Spacing: multiples of 4px (in use: 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 72, 88, 96, 120, 144); 2px only
  as an optical nudge. Sibling surfaces (cards, panels, tiles, the skills card) sit 12 to 16px apart; the About split
  56px, the hero's clamp(24px, 5vw, 72px). Container 1360px, gutter
  `--pad` clamp(20px, 5vw, 72px). Sections: 96px top and bottom (56px at 820px and under); Services 144 / 72 (88 / 40);
  the About band 120 / 120 (72 / 72). So the seams vary (about 260, 170, 215, 215px at 1440) and About changes paper.
- Radii: controls are pills (999px), the About disc a circle; every surface (cards, panels, tiles, the skills card, the
  project view, the photo label) is square with one 26px cut corner (`.cut`), never rounded.

## Controls
- Primary: ink fill, accent fill on hover (no lift), a 1px press · pill · 52px · Geist Mono 14px, sentence case,
  with the scramble on hover. Messenger is the only primary on the page (hero, contact; the header CTA is 44px).
- Secondary: outline in `--line` over a half page-colour wash, accent outline and text on hover · same radius · 52px
  (48px for `.sm`: skill groups, contact profiles, Copy, project links).

## Motion
- Character: atmospheric ASCII, always on while on screen. The budget below is waived on the record (owner).
- Engine (`src/engine.js`): ambient ASCII rain per section, the pointer's ASCII light (64px) and section glow (280px),
  the bust (boil, accent cloud, tilt), section reveal with decode, and the dissolve that replays it, the text
  scramble on hover (`data-scr`), the globe, the service objects, the deck arc with turning covers, the about photo,
  the tide. Layers draw only on screen.
- CSS: reveal 0.9s, dissolve 0.75s, panels 0.6s, project view 0.35s, colour 0.2s, press 0.15s; the marquee loops 48s
  and pauses under the pointer; the logo caret blinks five times and stays.
- Reduced motion: no veil, decode, dissolve, scramble, loop or transition; content always visible.

## Owner's decisions (2026-11-18)
- Labels, buttons, nav links, tags and `dt`s in sentence case, Geist Mono kept, tracking at most 0.03em (gate 67).
- The orchid italic happens once: the surname, on its own line under "Febriel" at every width (`h1.nm` > `span`).
  "all three." and "building?" are roman.
- One hover effect per work card: the scramble (and the link's own colour). No lift, no faster cover.
- The bust is `min(560px, 58vh, 40vw)` (522px at 1440x900); Work no longer shows on the first screen there.
- About sits on the band (`.band`, `--band`), the page's one change of paper.

## Waivers and open items (on the record)
- Floor 18 / WCAG 2.2.2, open by decision: moving content past 5s without a pause control. The owner declined a
  control; reduced motion stops everything, the marquee pauses on hover, the caret stops, layers stop off screen.
- 28 / F8 / craft § 5, the ASCII motion budget: replaying reveals, decode, parallax, tilt, cursor followers; the
  ASCII is the identity, not decoration.
- 66 (marquee): the mono-caps strip under the hero stays, with its capitals (67 stays open for it alone).
- 29 (glow): the accent glow that follows the pointer in each section stays, with the ASCII light.
- 42 (nav): the sticky bar (wordmark, five section links, theme pill, Messenger) is the hire anatomy's nav.
- 62: `data-fx="wait"` is only ever set by `engine.js`, so the page is complete with scripting off; print shows
  every section.
- 58 (copy): the hero's 13-word offer line is baked into `public/og.png`. Copy trims wait for the owner
  (`reports/copy-trim.md`, a proposal).

## Exports
None. Tokens live in `src/styles.css`; a Tailwind, DTCG or shadcn block goes here on request.
