// State + DOM glue. Replaces the design's React `Component`; DOM contract lives in PROJECT.md.
import { startEngine } from './engine.js';
import { SKILLS, GROUPS, PROJECTS, projectAt } from './data.js';

const root = document.querySelector('[data-ref="root"]');
const $ = (sel, el = root) => el.querySelector(sel);
const ref = (name, el = root) => $(`[data-ref="${name}"]`, el);
const bind = (name, el = root) => $(`[data-bind="${name}"]`, el);
const act = (name) => $(`[data-act="${name}"]`);

const pans = [...root.querySelectorAll('.pan[data-svc]')];
const work = ref('work'), deck = ref('deck');
const cardLink = (i) => $(`.wkl[href="#work/${PROJECTS[i].id}"]`); // cards carry no id: the browser's own scroll-to-fragment would take focus from the open dialog
const ARROW = 'M7 17 17 7M8 7h9v9'; // same arrow as the contact section's external links

// The engine reads `busy` (avatar "speaking"; always false since the chat is gone) and pushes `time` every 20 s
// (nothing displays it, so render() ignores it).
const state = { dark: root.classList.contains('is-dark'), svc: 0, cat: 'all', menu: false, modal: -1, busy: false };
const logic = {
  root: { current: root }, tilt: { current: ref('tilt') }, avatar: { current: ref('avatar') }, stage: { current: null },
  globe: { current: ref('globe') }, tide: { current: ref('tide') }, photo: { current: ref('photo') }, skl: { current: ref('skl') }, deck: { current: deck },
  state,
  props: { mode: 'Dark', glyph: 10, rain: 1, light: 1, motion: 1 },
  setState
};
let eng = null, dlg = null, shown = -1, copyT = 0;
let onWork = false; // the history entry under the open project is #work, so a close steps back to it instead of stacking another

function setState(patch) {
  Object.assign(state, patch);
  render(Object.keys(patch));
  eng?.sync(); // engine runs setState({ time }) inside startEngine, before `eng` is assigned
}

function render(keys) {
  const has = (k) => keys.includes(k);
  if (has('dark')) {
    root.classList.toggle('is-dark', state.dark);
    root.classList.toggle('is-light', !state.dark);
    bind('modeLabel').textContent = state.dark ? 'Dark' : 'Light';
    act('toggleMode').setAttribute('aria-label', state.dark ? 'Dark mode, switch to light' : 'Light mode, switch to dark'); // starts with the visible word (WCAG 2.5.3)
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue('--bg').trim();
  }
  if (has('menu')) {
    ref('menu').hidden = !state.menu;
    act('toggleMenu').setAttribute('aria-expanded', String(state.menu));
  }
  if (has('svc')) {
    pans.forEach((p, i) => {
      const on = i === state.svc;
      p.classList.toggle('on', on);
      $('.pb', p).hidden = !on;
      $('.ph', p).setAttribute('aria-expanded', String(on));
      if (on) logic.stage.current = $('canvas[data-stage]', p);
    });
  }
  if (has('cat')) renderCat();
  if (has('modal')) renderModal();
}

function renderCat() {
  const c = state.cat;
  let rows, title = 'Everything', kicker = 'All groups';
  if (c === 'all') {
    rows = GROUPS.map(([id, name]) => [name, SKILLS.filter((s) => s[1] === id).length + ' tools']);
  } else {
    rows = SKILLS.filter((s) => s[1] === c).map(([name]) => [name, name === 'Claude' ? 'specialty' : '']);
    title = (GROUPS.find((g) => g[0] === c) || ['', ''])[1];
    kicker = rows.length + ' in this group';
  }
  for (const b of root.querySelectorAll('button[data-cat]')) {
    const on = b.dataset.cat === c;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  }
  bind('catKicker').textContent = kicker;
  bind('catTitle').textContent = title;
  ref('catRows').replaceChildren(...rows.map(([a, b]) => el('div', 'skr', null, el('span', null, null, a), el('span', null, null, b))));
}

/* The project view: a <dialog> cloned in from the template on open and removed on close (the engine reads its mount).
   Only the URL opens it (route() below); every close (button, Escape, backdrop, Back) ends up here with modal -1. */
function renderModal() {
  const m = PROJECTS[state.modal];
  if (dlg) { // closing, or switching straight to another project
    const d = dlg;
    dlg = null; // its close event (below) now knows it wasn't the visitor
    d.close();
    d.remove();
    if (!m) cardLink(shown).focus(); // back to that project's card link, the opener in Work
  }
  shown = state.modal;
  if (!m) return;
  const frag = ref('modalTpl').content.cloneNode(true), d = $('[data-modal]', frag), facts = bind('modFacts', frag);
  bind('modTitle', frag).textContent = m.title;
  bind('modDesc', frag).textContent = m.desc;
  bind('modMore', frag).textContent = m.more;
  facts.append(...[['Role', m.role], ['Type', m.type], ['Tools', m.tools], ['Status', m.status]].filter((f) => f[1])
    .map(([k, v]) => el('div', null, null, el('dt', null, null, k), el('dd', null, null, v))));
  if (m.links) facts.after(el('div', 'mlk', null, ...m.links.map(([label, url]) => {
    const a = el('a', 'btn ghost sm', null, label, icon(ARROW));
    Object.assign(a, { href: url, target: '_blank', rel: 'noopener' });
    a.dataset.scr = '';
    a.setAttribute('aria-describedby', 'nt');
    return a;
  })));
  const cover = $('canvas[data-cover]', frag);
  if (m.image) cover.replaceWith(img(m)); else cover.dataset.cover = String(m.shape);
  let downOn = null;
  d.addEventListener('pointerdown', (e) => { downOn = e.target; });
  d.addEventListener('click', (e) => { if (e.target === d && downOn === d) d.close(); }); // the backdrop; not a text drag that ends there
  d.addEventListener('close', () => {
    if (d !== dlg) return;
    if (onWork) history.back(); // the hashchange closes it
    else { history.replaceState(null, '', '#work'); setState({ modal: -1 }); }
  });
  work.append(frag);
  dlg = d;
  d.showModal();
  work.scrollIntoView({ block: 'start', behavior: 'instant' }); // behind it: the big cover only draws while #work is on screen, and a close lands here
}

/* "#work/<id>" opens that project; any other hash (Back, a nav link) closes it */
function route(e) {
  const i = projectAt(location.hash);
  if (i === state.modal) return;
  if (i >= 0) onWork = Boolean(e) && new URL(e.oldURL).hash === '#work';
  setState({ modal: i, menu: false });
}

function img(p) {
  return Object.assign(document.createElement('img'), { loading: 'lazy', decoding: 'async', alt: p.alt, src: p.image });
}

function icon(d) {
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'), path = document.createElementNS(ns, 'path');
  svg.setAttribute('class', 'ic');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  path.setAttribute('d', d);
  svg.append(path);
  return svg;
}

function el(tag, cls, css, ...kids) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (css) n.style.cssText = css;
  n.append(...kids); // strings become text nodes, never parsed as HTML
  return n;
}

function slide(dir) {
  const first = deck.children[0], step = first ? first.offsetWidth + 18 : 320;
  deck.scrollBy({ left: dir * step * 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

// ---- events ----
const ACTIONS = {
  toggleMode: () => {
    setState({ dark: !state.dark });
    try { localStorage.setItem('fbo-mode', state.dark ? 'dark' : 'light'); } catch { /* storage blocked: mode just won't persist */ }
  },
  toggleMenu: () => setState({ menu: !state.menu }),
  closeMenu: () => setState({ menu: false }),
  deckPrev: () => slide(-1),
  deckNext: () => slide(1),
  closeModal: () => dlg?.close(),
  copyEmail: () => {
    const b = act('copyEmail'), a = $('.eml a');
    const done = () => { b.textContent = 'Copied'; clearTimeout(copyT); copyT = setTimeout(() => { b.textContent = 'Copy'; }, 2000); };
    const pick = () => getSelection().selectAllChildren(a); // clipboard blocked: select it for a manual copy
    try { navigator.clipboard.writeText(a.href.slice(7)).then(done, pick); } catch { pick(); } // href, since the text may be mid-scramble
  }
};

root.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act],[data-cat]');
  if (!t || !root.contains(t)) return;
  if (t.dataset.act) ACTIONS[t.dataset.act]?.();
  else setState({ cat: t.dataset.cat });
});
addEventListener('hashchange', route);
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.menu) { setState({ menu: false }); act('toggleMenu').focus(); }
});

pans.forEach((p, i) => {
  const pick = () => { if (state.svc !== i) setState({ svc: i }); };
  p.addEventListener('mouseenter', pick);
  $('.ph', p).addEventListener('click', pick);
  $('.ph', p).addEventListener('focus', pick);
});

PROJECTS.forEach((p, i) => { if (p.image) $('canvas[data-cover]', cardLink(i).closest('.wk')).replaceWith(img(p)); }); // a screenshot replaces the ASCII cover
render(['dark', 'menu', 'svc', 'cat']);
eng = startEngine(logic);
const deep = location.hash;
route();
// arrived on a project link: put #work under it, so Back closes the project instead of leaving the site
if (state.modal >= 0) { history.replaceState(null, '', '#work'); history.pushState(null, '', deep); onWork = true; }
