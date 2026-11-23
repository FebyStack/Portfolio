# Design: Febriel B. Otud portfolio

The portfolio reads as an INKWILD print on the web. Gambetta carries the typography, with real ASCII
characters as the illustration material. The project sequence, routes and Tidal Orchid light/dark themes are
shared with the earlier portfolio.

## Type and paper

- Gambetta for display type, Switzer for running text, Geist Mono for navigation, captions, controls and ASCII.
- Warm paper with deep teal ink in light mode and deep teal paper with warm ink in dark mode. The opening print uses dark ink in both themes.
- Orchid highlights the surname, primary action, portrait, selected controls and focus. Orchid and vermilion trace the ASCII currents.
- The 12-column grid has a maximum width of 1360px, with a 24px gap (16px on narrow screens) and
  `clamp(20px, 5vw, 72px)` side gutters. Hairlines structure the content. Controls use 2px corners and
  visible focus outlines. Section and project names use sentence case.

## Compositions

- The homepage cover combines the oversize name and the unframed ASCII portrait. The field crops the
  portrait at its baseline. A static field of bent ASCII contours sits behind it and fades before the offer. A ruled strip below holds the offer, “See my work” and availability. On smaller
  screens the portrait sits lower, offset toward the right. The header has the desktop Messenger link and
  a compact theme/menu pair on narrow screens. Contact keeps a full Messenger button.
- PilaPass leads with a representative Registrar ticket and an ordered walkthrough of joining the queue,
  tracking the ticket and getting called. The other four projects use their own still ASCII illustrations
  on distinct ink tones in alternating seven/five-column pairs, stacked on phones. The queue
  sample uses a warm paper ticket on a teal press bed.
- Services uses four line icons, a ruled accordion and an interactive specimen on a measurement grid.
  Skills uses a globe and a typographic index. In About, the portrait faces the quote and short facts.
  Contact closes on orchid-tinted paper with the still ASCII tide behind the lower margin.

## Motion

- The portrait resolves from glyphs once and responds to pointer input. Services and Skills change their
  ASCII art in response to selection or drag. The work plates, About photo and tide are still. Text remains
  readable on load and during interactions.
- Respect reduced motion by skipping the portrait reveal, inertia, and panel and dialog entrances. Retain
  the final artwork and focus behavior. The canvas backing-size cap still applies.
