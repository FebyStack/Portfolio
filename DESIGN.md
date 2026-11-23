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
  editorial marks: the 32×2px tick that starts each section's opening rule and the open service's rule, the 6px square
  before a caption, the marquee's slashes, and the label of a picked skill group. No numbers anywhere (owner,
  2026-11-19: no section, figure, nav, menu or entry numbering).
- Type scale: Geist Mono at 12px for captions, labels and the marquee, 14px for controls and hints. Switzer at
  17px for reading text and 14px for the hero dateline. Gambetta for the offer line, project and service titles,
  section heads, and the name. The display scale is fluid, with section heads at 2.75–5.75rem and the name at
  3.5–8rem. Labels and controls are sentence case. The marquee keeps capitals.
- Grid: `.g12`, twelve `minmax(0,1fr)` columns, `--gap` 24px (16px ≤820px) inside the 1360px container.
  Section headings follow a hairline with a short vermilion mark. When present, hints sit below the heading.
- Spacing: the gutter is `clamp(20px, 5vw, 72px)`. Sections use 64px top and 80px bottom (40 / 48 at ≤820px);
  About uses 80px on both sides (48px at ≤820px). The static ASCII dividers span the content width between sections.
  The page paper is flat and the dot texture sits inside the portrait frame.
- Radii: controls are pills (999px); the project view keeps the one 26px cut corner (`.cut`); everything else is square
  and open (rules, wells), never rounded.

## Compositions
- Hero: name, offer and actions on columns 1–6. The framed ASCII portrait and caption occupy columns 7–12, with
  the dateline under the actions. At ≤820px the portrait goes between the actions and the dateline. Messenger is
  the filled action and “See my work” is a text link.
- Work: PilaPass leads with a full-width split feature (copy on columns 1–4, a 2:1 cover on 5–12).
  The other four projects sit in two pairs with 16:9 covers above their summaries. At ≤600px all five stack.
- Services: the four titles form a ruled list on 1–6, with a chevron marking the open state. The active service's
  description, tags and drag-to-turn ASCII object sit on 8–12. Hover, click or focus opens a service. At ≤820px its
  panel sits below its trigger.
- Skills: the globe and caption sit on 1–6. On 7–12 are the group controls and a ruled index of all 26 tools.
  At ≤820px the wrapping controls come before the globe, with the index below it.
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
  photo's drift were removed 2026-11-19). The rain and light are full strength in the page
  margins and the hero's picture side, 30% over text columns (drawn in the canvas, never a CSS `mask`: iOS); they draw
  at 1 device pixel per CSS pixel.
- Canvas memory (iOS): about 32 MB of live canvas backing on a 390×844@3 phone; no canvas over 4.19M device px; a
  section's rain canvas is freed more than a screen away. Any new canvas or large illustration follows these rules
  (`PROJECT.md`, Canvas memory).
- CSS: reveal 0.55s (88% opacity and an 8px rise), panels 0.6s, project view 0.35s, colour 0.2s and press 0.15s.
  The marquee loops in 48s and pauses under the pointer. The logo caret blinks five times and stays.
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
