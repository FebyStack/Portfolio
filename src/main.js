// State + DOM glue. Replaces the design's React `Component`; DOM contract lives in PROJECT.md.
import { startEngine } from './engine.js';
import { SKILLS, GROUPS, PROJECTS, projectAt } from './data.js';

const root = document.querySelector('[data-ref="root"]');
const $ = (sel, el = root) => el.querySelector(sel);
const ref = (name, el = root) => $(`[data-ref="${name}"]`, el);
const bind = (name, el = root) => $(`[data-bind="${name}"]`, el);
const act = (name) => $(`[data-act="${name}"]`);

const pans = [...root.querySelectorAll('.pan[data-svc]')];
const work = ref('work');
const cardLink = (i) => $(`.wkl[href="#work/${PROJECTS[i].id}"]`); // cards carry no id: the browser's own scroll-to-fragment would take focus from the open dialog
const ARROW = 'M7 17 17 7M8 7h9v9'; // same arrow as the contact section's external links

const state = { dark: root.classList.contains('is-dark'), svc: 0, cat: 'all', menu: false, modal: -1 };
const logic = {
  root: { current: root }, inkField: { current: ref('inkField') }, avatar: { current: ref('avatar') }, stage: { current: null },
  globe: { current: ref('globe') }, tide: { current: ref('tide') }, photo: { current: ref('photo') },
  state
};
let eng = null, dlg = null, shown = -1, copyT = 0;
let onWork = false; // the history entry under the open project is #work, so a close steps back to it instead of stacking another
let followOS = true; // no stored mode: the theme follows the OS (index.html's pre-paint rule) until the visitor toggles
try { followOS = !localStorage.getItem('fbo-mode'); } catch { /* storage blocked: nothing stored */ }

function setState(patch) {
  Object.assign(state, patch);
  render(Object.keys(patch));
  eng?.sync(); // null only if startEngine threw: the page still renders without the effects
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

/* the index lists every tool as static text; a picked group is marked in it (and gathers on the globe) */
function renderCat() {
  const c = state.cat, all = c === 'all';
  const title = all ? 'Everything' : (GROUPS.find((g) => g[0] === c) || ['', ''])[1];
  const kicker = all ? SKILLS.length + ' tools' : SKILLS.filter((s) => s[1] === c).length + ' in this group'; // a fact over the title, not a name for it
  for (const b of root.querySelectorAll('button[data-cat]')) {
    const on = b.dataset.cat === c;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  }
  bind('catKicker').textContent = kicker;
  bind('catTitle').textContent = title;
  const ix = ref('catRows');
  ix.classList.toggle('f', !all);
  for (const r of ix.children) r.classList.toggle('on', r.dataset.g === c);
}

/* The project view: a <dialog> cloned in from the template on open and removed on close.
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
  d.setAttribute('aria-label', m.title);
  bind('modTitle', frag).textContent = m.title;
  bind('modDesc', frag).textContent = m.desc;
  bind('modMore', frag).textContent = m.more;
  facts.append(...[['Role', m.role], ['Type', m.type], ['Tools', m.tools], ['Status', m.status]].filter((f) => f[1])
    .map(([k, v]) => el('div', null, el('dt', null, k), el('dd', null, v))));
  if (m.links) facts.after(el('div', 'mlk', ...m.links.map(([label, url]) => {
    const a = el('a', 'btn ghost sm', label, icon(ARROW));
    Object.assign(a, { href: url, target: '_blank', rel: 'noopener' });
    a.setAttribute('aria-describedby', 'nt');
    return a;
  })));
  $('.mvid', frag).append($('.wkc', cardLink(state.modal).closest('.wk')).cloneNode(true));
  // the backdrop: pressed and released outside the dialog's box (its own scrollbar is inside it, and so is a text drag's start)
  const out = (e) => { const r = d.getBoundingClientRect(); return e.target === d && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom); };
  let downOut = false;
  d.addEventListener('pointerdown', (e) => { downOut = out(e); });
  d.addEventListener('click', (e) => { if (downOut && out(e)) d.close(); });
  d.addEventListener('close', () => {
    if (d !== dlg) return;
    if (onWork) history.back(); // the hashchange closes it
    else { history.replaceState(null, '', '#work'); setState({ modal: -1 }); }
  });
  work.append(frag);
  dlg = d;
  d.showModal(); // the page doesn't move: the dialog sits in the top layer, so its big cover is always on screen
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

function el(tag, cls, ...kids) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  n.append(...kids); // strings become text nodes, never parsed as HTML
  return n;
}

// ---- events ----
const ACTIONS = {
  toggleMode: () => {
    followOS = false;
    setState({ dark: !state.dark });
    try { localStorage.setItem('fbo-mode', state.dark ? 'dark' : 'light'); } catch { /* storage blocked: mode just won't persist */ }
  },
  toggleMenu: () => setState({ menu: !state.menu }),
  closeMenu: () => setState({ menu: false }),
  closeModal: () => dlg?.close(),
  copyEmail: () => {
    const b = act('copyEmail'), a = $('.eml a'), live = $('.eml [aria-live]');
    const say = (t) => { b.textContent = live.textContent = t; clearTimeout(copyT); copyT = setTimeout(() => { b.textContent = 'Copy'; live.textContent = ''; }, 2000); };
    const done = () => say('Copied');
    const pick = () => { getSelection().selectAllChildren(a); say('Address selected. Press Ctrl or ⌘ + C to copy.'); }; // clipboard blocked: select it for a manual copy
    try { navigator.clipboard.writeText(a.href.slice(7)).then(done, pick); } catch { pick(); }
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
// past the breakpoint the menu button is hidden (styles.css; data.test.js keeps the two numbers equal), so the menu closes
matchMedia('(max-width:820px)').addEventListener('change', (e) => { if (!e.matches && state.menu) setState({ menu: false }); });
matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => { if (followOS) setState({ dark: !e.matches }); });

pans.forEach((p, i) => {
  const pick = () => { if (state.svc !== i) setState({ svc: i }); };
  $('.ph', p).addEventListener('mouseenter', pick); // the title, not the panel: the open panel's object sits beside the list
  $('.ph', p).addEventListener('click', pick);
  $('.ph', p).addEventListener('focus', pick);
});

PROJECTS.forEach((p, i) => { if (p.image) $('.wkc', cardLink(i).closest('.wk')).replaceChildren(img(p)); }); // a screenshot replaces the ASCII cover
render(['dark', 'menu', 'svc', 'cat']);
eng = startEngine(logic);
// a project link opens on its own entry, with no history writes before the visitor acts (Chrome's Back skips entries
// pushed without a user gesture, which would take them off the site); closing it then replaces the hash with #work
route();
