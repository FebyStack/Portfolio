# Design: Febriel B. Otud portfolio

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.
Owner's decisions and waivers below bind like the rest: a Hallmark run reports them as kept, never "fixes" them.

## System
- Genre: editorial poster over the atmospheric ASCII (2026-11-19, owner's pick "Editorial poster": magazine feel, very
  large serif heads, asymmetric columns, ASCII as big illustration blocks and dividers). Dark default, the ASCII rain
  and pointer light kept, calmer over text.
- Shape of the first page: one page, a 12-column grid. Hero (poster front page), marquee, Work (feature list), Services
  (a ruled list beside the open service's object), Skills (globe beside a ruled index of every tool), About (pull
  quote, captioned photo, ruled facts, on the band), Contact (closing poster, the tide), colophon footer. An ASCII band
  divides each pair of sections from Work on.
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
--mark: #FF7A52;                                                         /* second accent, vermilion */
/* light */
--bg: #ECE7DA;  --bg2: #E1DBC9;  --band: #E6E1D1;  --line: #C9C2AE;
--ink: #0E2429;  --mute: #4C6163;  --accent: #5B36C9;  --on-accent: #F4F0FF;
--mark: #A8350F;   /* the brand plan's #B83A17 is 4.15:1 on --bg2, so one step darker */
/* --band = color-mix(in oklab, var(--bg), var(--bg2)); --grain, --glow, --shade, --bgc derive from the same hues */
--serif: "Gambetta";  --sans: "Switzer";  --mono: "Geist Mono";  /* display / body / the ASCII material */
```
- Contrast (WCAG, lowest pairs): light `--mute` on `--bg2` 4.75:1, on the band 5.03:1; dark `--mute` on the band 6.55:1.
  Any new pair stays at 4.5:1 or more. `--mark` dark: 6.99 on --bg, 6.06 on --bg2, 6.55 on the band; light: 5.35,
  4.77, 5.05. Orchid stays for the surname, actions, focus and the ASCII highlights; vermilion only for small
  editorial marks: the 48×3px tick that starts each section's opening rule and the open service's rule, the 6px square
  before a caption, the marquee's slashes, and the label of a picked skill group. No numbers anywhere (owner,
  2026-11-19: no section, figure, nav, menu or entry numbering).
- Type scale (`.fbo`): `--fs-xs` 12px mono furniture (running heads, captions, labels, `dt`, marquee) · `--fs-sm`
  14px buttons, nav, hints, proof line · `--fs-md` 17px Switzer reading text (line-height 1.5, `--measure` 40ch) ·
  `--fs-lg` clamp(22px, 2.1vw, 30px) offer line, standfirsts ("Tell me what it is…"), contact rows, project-view title
  · `--fs-title` clamp(28px, 3vw, 44px) service titles · `--fs-xl` clamp(36px, 4vw, 60px) project titles, the skills
  group title · `--fs-2xl` clamp(40px, 5.6vw, 84px) the About pull quote · `--fs-display` clamp(48px, 6.6vw, 104px)
  section openers (`h2`, line-height .95, -0.03em) · `--fs-name` clamp(56px, 8vw, 128px) the name (largest on the page). Weights: Gambetta 300 (the name only) and 400, Switzer 400, Geist Mono 500.
  Labels and controls are sentence case, tracked 0 to 0.03em; the marquee alone keeps capitals.
- Grid: `.g12`, twelve `minmax(0,1fr)` columns, `--gap` 24px (16px ≤820px), inside the 1360px container. Head block:
  the opening rule (1px ink, vermilion tick, section name at the right in mono), the `h2` on columns 1–9, the hint as
  marginalia on 10–12, 64px to the body. Rules, not cards: hairlines in `--line` part rows; the only filled surfaces
  are the cover wells (`--bg2`), the About band and the project view.
- Spacing: multiples of 4px (in use: 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 72, 88, 96, 120, 144); 2px only
  as an optical nudge. Sibling surfaces (cards, panels, tiles, the skills card) sit 12 to 16px apart; the About split
  56px, the hero's clamp(24px, 5vw, 72px). Container 1360px, gutter
  `--pad` clamp(20px, 5vw, 72px). Sections: 72px top, 96px bottom (56 / 56 at 820px and under); the About band 96 / 96 (72 / 72); Contact 72 / 48
  above the tide. The ASCII band (`.sep`, 3 rows of 12px Geist Mono from the engine's ramp, static, 70% `--mute`, a
  different offset per seam, 24px above and below) sits between Work, Services, Skills, About and Contact.
- Radii: controls are pills (999px); the project view keeps the one 26px cut corner (`.cut`); everything else is square
  and open (rules, wells), never rounded.

## Compositions (1440; ≤820px everything stacks in reading order)
- Hero (Settled, fills the screen under the header down to the marquee): text on columns 1–7 (name on two lines, the
  offer line, the two buttons, then a ruled dateline of two columns: the availability line and the proof line); the
  bust on 8–12 (`min(100%, 56vh)`) with its caption "Portrait drawn the INKWILD way, then set in ASCII." (moved from
  the footer). Messenger at y 552 on 1440×900, 347 on 375×812.
- Work: five ruled entries; each sets its cover at a different span, ratio and side: text 1–4 / cover 5–12 at 2:1;
  text 1–5 / cover 7–12 at 16:9; cover 1–7 at 2:1 / text 9–12 (the one mirror); text 1–4 / cover 6–12 at 21:9; text
  1–5 / cover 8–12 at 3:2. Title at `--fs-xl`, the one-line desc, "View …". 601–820px: cover 1–7, text 8–12; ≤600px
  cover over text.
- Services: the four titles as a ruled list on 1–6 (the open one in ink under an ink rule with the vermilion tick); the
  open service's text, tags and its drag-to-turn object on 8–12 (`.pan` is `display: contents`, so opening another
  never moves the list). Hover, click or focus opens. ≤820px an accordion.
- Skills: the globe on 1–6 with its caption; on 7–12 the count over the group title, the group buttons, and a ruled
  `dl` index of all 26 tools by group (static text; a picked group's row stays ink, the others go to `--mute`).
- About (band): the statement as the `h2` pull quote on 1–11 at `--fs-2xl`; the photo (≤520px) on 1–6 captioned
  "Hi, I’m Febriel"; the facts as a ruled `dl` on 8–12, bottom-aligned.
- Contact: the question at `--fs-display` on 1–11; standfirst, Messenger and the reply lines on 1–5; email (+ Copy),
  LinkedIn, Instagram, GitHub and Follow INKWILD as 72px ruled rows on 7–12; the tide; the colophon (© and Back to
  top).
- Header: wordmark left; plain sentence-case links, the theme pill and the Messenger pill right; solid paper, no blur.
  Phone menu: a contents page, Gambetta 28px rows, 56px tall.

## Controls
- Primary: ink fill, accent fill on hover (no lift), a 1px press · pill · 52px · Geist Mono 14px, sentence case,
  with the scramble on hover. Messenger is the only primary on the page (hero, contact; the header CTA is 44px).
- Secondary: outline in `--line` over a half page-colour wash, accent outline and text on hover · same radius · 52px
  (48px for `.sm`: skill groups, contact profiles, Copy, project links).

## Motion
- Character: atmospheric ASCII, always on while on screen. The budget below is waived on the record (owner).
- Engine (`src/engine.js`): ambient ASCII rain per section, the pointer's ASCII light (64px) and section glow (280px),
  the bust (boil, accent cloud, tilt), section reveal with decode (once per section, first time in view), the text
  scramble on hover (`data-scr`), the globe, the service objects, the turning work covers, the about photo, the tide.
  Layers draw only on screen (each cover is observed on its own). No scroll parallax (the deck arc and the About
  photo's drift were removed 2026-11-19). The rain and light are masked (CSS `mask`) to full strength in the page
  margins and the hero's picture side, 30% over text columns; they draw at 1 device pixel per CSS pixel.
- CSS: reveal 0.9s (opacity and an 18px rise; the blur was dropped 2026-11-19 for cost on tall sections), panels 0.6s, project view 0.35s, colour 0.2s, press 0.15s; the marquee loops 48s
  and pauses under the pointer; the logo caret blinks five times and stays.
- Reduced motion: no veil, decode, scramble, loop or transition; content always visible.

## Owner's decisions (2026-11-19)
- Editorial poster direction; one second accent (vermilion) for marks only; no numbering furniture anywhere.
- The outlined "Febriel" behind the About photo and its disc are gone (the photo is a captioned figure now).

## Owner's decisions (2026-11-18)
- Labels, buttons, nav links, tags and `dt`s in sentence case, Geist Mono kept, tracking at most 0.03em (gate 67).
- The orchid italic happens once: the surname, on its own line under "Febriel" at every width (`h1.nm` > `span`).
  "all three." and "building?" are roman.
- One hover effect per work card: the scramble (and the link's own colour). No lift, no faster cover.
- The bust was `min(560px, 58vh, 40vw)`; since 2026-11-19 it is five columns, `min(100%, 56vh)` (492px at 1440x900).
- About sits on the band (`.band`, `--band`), the page's one change of paper.

## Waivers and open items (on the record)
- Floor 18 / WCAG 2.2.2, open by decision: moving content past 5s without a pause control. The owner declined a
  control; reduced motion stops everything, the marquee pauses on hover, the caret stops, layers stop off screen.
- 28 / F8 / craft § 5, the ASCII motion budget: reveals, decode, tilt, cursor followers; the ASCII is the identity,
  not decoration. (Scroll parallax is gone since 2026-11-19.)
- 66 (marquee): the mono-caps strip under the hero stays, with its capitals (67 stays open for it alone).
- 29 (glow): the accent glow that follows the pointer in each section stays, with the ASCII light.
- 42 (nav): the sticky bar (wordmark, five section links, theme pill, Messenger) is the hire anatomy's nav.
- 62: `data-fx="wait"` is only ever set by `engine.js`, so the page is complete with scripting off; print shows
  every section.
- 58 (copy): the hero's 13-word offer line is baked into `public/og.png`. The copy trims are applied
  (`reports/copy-trim.md`, approved as proposed 2026-11-18).

## Exports
None. Tokens live in `src/styles.css`; a Tailwind, DTCG or shadcn block goes here on request.
