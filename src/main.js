// State + DOM glue. Replaces the design's React `Component`; DOM contract lives in PROJECT.md.
import { startEngine } from './engine.js';
import { SKILLS, GROUPS, PROJECTS } from './data.js';
import { localAnswer } from '../supabase/functions/_shared/facts.js';
import { MAX_HISTORY, MAX_TEXT, HOST } from '../supabase/functions/_shared/validate.js';

const root = document.querySelector('[data-ref="root"]');
const $ = (sel, el = root) => el.querySelector(sel);
const ref = (name, el = root) => $(`[data-ref="${name}"]`, el);
const bind = (name, el = root) => $(`[data-bind="${name}"]`, el);
const act = (name) => $(`[data-act="${name}"]`);

const pans = [...root.querySelectorAll('.pan[data-svc]')];
const log = ref('log'), askInput = ref('askInput'), work = ref('work'), deck = ref('deck');
const ASK_URL = import.meta.env.VITE_ASK_URL;
// Chat analytics context. The session id lives in memory only (new per page load; no cookie, no storage), so no consent
// banner. randomUUID needs a secure context: on plain http it's undefined and simply left out of the request.
const SID = crypto.randomUUID?.();
const refHost = document.referrer && new URL(document.referrer).hostname;
const REF = refHost !== location.hostname && HOST.test(refHost) ? refHost : undefined;
// Thumb drawn on the .ic grid (24 box, 1.5 stroke, round caps); thumbs down is the same path turned 180deg.
const THUMB = 'M3 10h4v10H3zM7 10l3.5-6.5c1.4 0 2.4 1.2 2 2.6L12 10h6.2a1.8 1.8 0 0 1 1.8 2.1l-1.2 6.2a2 2 0 0 1-2 1.7H7';
const ARROW = 'M7 17 17 7M8 7h9v9'; // same arrow as the contact section's external links

const state = {
  dark: root.classList.contains('is-dark'), svc: 0, cat: 'all', pin: false, menu: false, modal: -1, busy: false, time: 'UTC+8',
  msgs: [{ role: 'bot', text: 'Hi. I am Febriel in ASCII. Hover my face to see the drawing, or ask me something.' }]
};
const logic = {
  root: { current: root }, tilt: { current: ref('tilt') }, avatar: { current: ref('avatar') }, stage: { current: null },
  globe: { current: ref('globe') }, tide: { current: ref('tide') }, photo: { current: ref('photo') }, skl: { current: ref('skl') }, deck: { current: deck },
  state,
  props: { mode: 'Dark', glyph: 10, reveal: 0.38, rain: 1, light: 1, motion: 1 },
  setState
};
let eng = null, modalEl = null, opener = null, typer = 0;

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
  if (has('time')) bind('time').textContent = state.time;
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
  if (has('pin')) {
    const b = act('togglePin'), label = state.pin ? 'Back to ASCII' : 'Show the drawing';
    b.classList.toggle('on', state.pin);
    b.setAttribute('aria-pressed', String(state.pin));
    b.setAttribute('aria-label', label);
    b.title = label;
  }
  if (has('msgs') || has('busy')) renderLog();
  if (has('busy')) { ref('send').disabled = state.busy; log.setAttribute('aria-busy', String(state.busy)); }
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

function renderLog() {
  const shown = state.msgs.slice(-2);
  log.replaceChildren(...shown.map((m, i) => {
    const you = m.role === 'you';
    const p = el('p', null, 'margin: 0; font-family: var(--mono); font-size: 13px; line-height: 1.5; white-space: pre-wrap; min-width: 0', m.text);
    if (!you && i === shown.length - 1 && state.busy) {
      const cur = el('span', 'cur', null, '_');
      cur.setAttribute('aria-hidden', 'true');
      p.append(cur);
    } else if (!you && i === shown.length - 1 && m.id) p.append(rateBox(m));
    return el('div', null, 'display: flex; gap: 12px; align-items: baseline',
      el('span', null, `flex: 0 0 56px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.09em; text-transform: uppercase; color: ${you ? 'var(--mute)' : 'var(--accent)'}`, you ? 'You' : 'Avatar'),
      p);
  }));
  log.scrollTop = log.scrollHeight;
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

// Thumbs up/down at the end of the latest Groq answer (local answers have no id, so no rating). Updated in place on
// a vote, so focus stays on the pressed button and the live log announces only "Thanks.".
function rateBox(m) {
  const box = el('span', null, 'display: inline-flex; align-items: center; gap: 12px; margin-left: 12px; vertical-align: middle; font-size: 12px; color: var(--mute)');
  box.dataset.nofx = '';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'Rate this answer');
  const btns = [[1, 'Helpful'], [-1, 'Not helpful']].map(([v, label]) => {
    const svg = icon(THUMB);
    if (v < 0) svg.style.transform = 'rotate(180deg)';
    const b = el('button', 'icb rt', null, svg);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => {
      if (m.rating) return; // one vote per answer
      m.rating = v;
      paint();
      box.append('Thanks.');
      log.scrollTop = log.scrollHeight;
      // fire-and-forget: a lost vote isn't worth an error message
      fetch(ASK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: m.id, rating: v }) }).catch(() => {});
    });
    return [v, b];
  });
  const paint = () => btns.forEach(([v, b]) => {
    b.classList.toggle('on', m.rating === v);
    b.setAttribute('aria-pressed', String(m.rating === v));
    if (m.rating) b.setAttribute('aria-disabled', 'true');
  });
  paint();
  box.append(...btns.map(([, b]) => b), ...(m.rating ? ['Thanks.'] : []));
  return box;
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

// ---- chat ----
function setLast(text, busy, id) {
  state.msgs[state.msgs.length - 1] = { role: 'bot', text, id };
  setState({ msgs: state.msgs, busy });
}

function typeOut(text, id) {
  clearInterval(typer);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setLast(text, false, id);
  let n = 0;
  typer = setInterval(() => {
    n = Math.min(text.length, n + 3);
    setLast(text.slice(0, n), n < text.length, id);
    if (n >= text.length) clearInterval(typer);
  }, 28);
}

// ponytail: non-streaming request, then typed out client-side. Ceiling: no token streaming
// (the whole reply waits on Groq). Upgrade: SSE from the edge function, setLast per chunk.
async function remote(q, history) {
  if (!ASK_URL) return null;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(ASK_URL, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q, history, sid: SID, ref: REF }), signal: ctl.signal
    });
    const j = r.ok ? await r.json() : null;
    const text = typeof j?.text === 'string' ? j.text.trim() : '';
    return text ? { text, id: typeof j.id === 'string' ? j.id : undefined } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function ask(q) {
  q = (q || '').replace(/\s+/g, ' ').trim();
  if (!q || state.busy) return;
  const history = state.msgs.slice(-MAX_HISTORY).filter((m) => m.text).map((m) => ({ role: m.role, text: m.text.slice(0, MAX_TEXT) }));
  askInput.value = '';
  setState({ msgs: state.msgs.concat([{ role: 'you', text: q }, { role: 'bot', text: '' }]).slice(-8), busy: true });
  const r = await remote(q, history);
  typeOut(r?.text || localAnswer(q), r?.id);
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
  togglePin: () => setState({ pin: !state.pin }),
  focusAsk: () => setTimeout(() => askInput.focus(), 60),
  deckPrev: () => slide(-1),
  deckNext: () => slide(1),
  closeModal: () => setState({ modal: -1 })
};

root.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act],[data-cat],[data-q],[data-open]');
  if (!t || !root.contains(t)) return;
  if (t.dataset.act) ACTIONS[t.dataset.act]?.();
  else if (t.dataset.cat) setState({ cat: t.dataset.cat });
  else if (t.dataset.q != null) ask(t.dataset.q || t.textContent);
  else if (t.dataset.open != null) { opener = t; setState({ modal: Number(t.dataset.open) }); }
});

ref('askForm').addEventListener('submit', (e) => { e.preventDefault(); ask(askInput.value); });

pans.forEach((p, i) => {
  const pick = () => { if (state.svc !== i) setState({ svc: i }); };
  p.addEventListener('mouseenter', pick);
  $('.ph', p).addEventListener('click', pick);
  $('.ph', p).addEventListener('focus', pick);
});

render(['dark', 'menu', 'svc', 'cat', 'pin', 'busy']);
eng = startEngine(logic);
