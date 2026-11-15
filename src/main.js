// State + DOM glue. Replaces the design's React `Component`; DOM contract lives in PROJECT.md.
import { startEngine } from './engine.js';
import { SKILLS, GROUPS, PROJECTS } from './data.js';

const root = document.querySelector('[data-ref="root"]');
const $ = (sel, el = root) => el.querySelector(sel);
const ref = (name, el = root) => $(`[data-ref="${name}"]`, el);
const bind = (name, el = root) => $(`[data-bind="${name}"]`, el);
const act = (name) => $(`[data-act="${name}"]`);

const pans = [...root.querySelectorAll('.pan[data-svc]')];
const work = ref('work'), deck = ref('deck');
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
let eng = null, modalEl = null, opener = null;

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
    act('toggleMode').setAttribute('aria-label', state.dark ? 'Switch to light mode' : 'Switch to dark mode');
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

function renderModal() {
  const m = PROJECTS[state.modal];
  const closing = !m && modalEl;
  modalEl?.remove(); // also covers switching straight from one project to another
  modalEl = null;
  work.querySelector('.wrap').inert = Boolean(m); // cards behind the overlay can't be focused or clicked
  if (closing) { opener?.focus(); opener = null; }
  if (m) {
    const frag = ref('modalTpl').content.cloneNode(true);
    modalEl = $('[data-modal]', frag);
    modalEl.setAttribute('aria-label', m.title);
    bind('modTitle', frag).textContent = m.title;
    bind('modDesc', frag).textContent = m.desc;
    const tags = bind('modTags', frag);
    tags.textContent = m.tags;
    if (m.links) tags.after(el('div', null, 'display: flex; flex-wrap: wrap; gap: 12px', ...m.links.map(([label, url]) => {
      const a = el('a', 'btn ghost sm', null, label, icon(ARROW));
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.dataset.scr = '';
      return a;
    })));
    const vid = ref('vid', frag);
    const novideo = frag.querySelectorAll('[data-novideo]');
    if (m.video) {
      novideo.forEach((n) => n.remove());
      vid.src = m.video;
      vid.hidden = false;
    } else {
      vid.remove();
      novideo.forEach((n) => { n.hidden = false; if (n.matches('canvas')) n.dataset.cover = String(m.shape); });
    }
    modalEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') setState({ modal: -1 }); });
    work.append(frag);
    work.scrollIntoView({ block: 'start' });
    ref('mclose', modalEl).focus();
  }
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
  const card = deck.children[0], step = card ? card.offsetWidth + 18 : 320;
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
  closeModal: () => setState({ modal: -1 })
};

root.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act],[data-cat],[data-open]');
  if (!t || !root.contains(t)) return;
  if (t.dataset.act) ACTIONS[t.dataset.act]?.();
  else if (t.dataset.cat) setState({ cat: t.dataset.cat });
  else if (t.dataset.open != null) { opener = t; setState({ modal: Number(t.dataset.open) }); }
});

pans.forEach((p, i) => {
  const pick = () => { if (state.svc !== i) setState({ svc: i }); };
  p.addEventListener('mouseenter', pick);
  $('.ph', p).addEventListener('click', pick);
  $('.ph', p).addEventListener('focus', pick);
});

render(['dark', 'menu', 'svc', 'cat']);
eng = startEngine(logic);
