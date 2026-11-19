import { SKILLS } from './data.js';

/* ---------- constants ---------- */
var RAMP = " .',;:clodxkO0KXNWM";
var RL = RAMP.length;
var PHOTO_URL = '/img/photo.webp';
var MAP_URL = '/img/avatar-map.png';

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function smooth(a, b, x) { var t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
function hash2(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
function vnoise(x, y) {
  var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  var a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function monoFont(px, wt) { return (wt || 500) + ' ' + px + 'px "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace'; }
/* a stand-in glyph of about the same width as the real character */
function scrChar(c, r) {
  if (c === ' ' || c === '\n' || c === ' ') return c;
  if (c >= '0' && c <= '9') return String(Math.floor(r * 10));
  if (c >= 'A' && c <= 'Z') return 'KXNWMO0'.charAt(Math.floor(r * 7));
  if (c.toLowerCase() !== c.toUpperCase()) return 'clodxk'.charAt(Math.floor(r * 6));
  return ".',;:".charAt(Math.floor(r * 5));
}
/* a section reveals, once, when 160px of it is on screen (a third of it, or of the viewport, when that is less, so it can
   always get there) */
function inView(seen, vh, h) { return seen >= Math.min(160, Math.min(vh, h) / 3); }

/* ---------- 3D shapes (signed distance) ---------- */
function sdBox(x, y, z, bx, by, bz, r) {
  var qx = Math.abs(x) - bx, qy = Math.abs(y) - by, qz = Math.abs(z) - bz;
  var ox = qx > 0 ? qx : 0, oy = qy > 0 ? qy : 0, oz = qz > 0 ? qz : 0;
  var m = Math.max(qx, Math.max(qy, qz));
  return Math.sqrt(ox * ox + oy * oy + oz * oz) + (m < 0 ? m : 0) - r;
}
function smin(a, b, k) { var h = clamp01(0.5 + 0.5 * (b - a) / k); return b + (a - b) * h - k * h * (1 - h); }
function sdf(k, x, y, z, t) {
  var a, b, d, q, x2, y2, z2;
  if (k === 0) { /* systems: three nested rings */
    a = Math.cos(t * 0.7); b = Math.sin(t * 0.7);
    q = Math.sqrt(x * x + z * z) - 0.86; d = Math.sqrt(q * q + y * y) - 0.07;
    x2 = x * a - y * b; y2 = x * b + y * a;
    q = Math.sqrt(y2 * y2 + z * z) - 0.64; d = Math.min(d, Math.sqrt(q * q + x2 * x2) - 0.07);
    y2 = y * a - z * b; z2 = y * b + z * a;
    q = Math.sqrt(x * x + y2 * y2) - 0.42; d = Math.min(d, Math.sqrt(q * q + z2 * z2) - 0.07);
    return Math.min(d, Math.sqrt(x * x + y * y + z * z) - 0.17);
  }
  if (k === 1) { /* brand: a cut gem */
    a = (Math.abs(x) + Math.abs(y) * 0.8 + Math.abs(z) - 0.95) * 0.577;
    b = Math.max(Math.abs(x), Math.abs(z)) - 0.62;
    return Math.max(a, b);
  }
  if (k === 2) { /* web and apps: a stack of layers */
    a = Math.sin(t * 0.9) * 0.16;
    d = sdBox(x, y - 0.46, z, 0.6, 0.085, 0.6, 0.05);
    d = Math.min(d, sdBox(x - a, y, z + a, 0.6, 0.085, 0.6, 0.05));
    return Math.min(d, sdBox(x, y + 0.46, z, 0.6, 0.085, 0.6, 0.05));
  }
  if (k === 4) { /* events: two linked rings */
    x2 = x + 0.3; q = Math.sqrt(x2 * x2 + z * z) - 0.5; d = Math.sqrt(q * q + y * y) - 0.085;
    x2 = x - 0.3; q = Math.sqrt(x2 * x2 + y * y) - 0.5;
    return Math.min(d, Math.sqrt(q * q + z * z) - 0.085);
  }
  /* content and motion: three drops that merge */
  a = t * 0.9;
  x2 = x - 0.38 * Math.cos(a); y2 = y - 0.22 * Math.sin(a * 1.3);
  d = Math.sqrt(x2 * x2 + y2 * y2 + z * z) - 0.52;
  x2 = x + 0.42 * Math.cos(a * 0.8); y2 = y + 0.3 * Math.sin(a); z2 = z - 0.2 * Math.sin(a * 0.7);
  d = smin(d, Math.sqrt(x2 * x2 + y2 * y2 + z2 * z2) - 0.4, 0.4);
  y2 = y - 0.5 * Math.cos(a * 0.6); z2 = z + 0.42 * Math.sin(a * 1.1);
  return smin(d, Math.sqrt(x * x + y2 * y2 + z2 * z2) - 0.3, 0.4);
}

/* ---------- engine ---------- */
export function startEngine(logic) {
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var E = { t: 0, col: null, dark: true, svc: 0, cat: 'all', modal: -1, speed: 1, rain: 1, light: 1, glyph: 10, themeDirty: true };
  var raf = 0, last = performance.now(), lastDraw = 0, tick = 0;
  var io = new IntersectionObserver(function (es) {
    for (var i = 0; i < es.length; i++) if (es[i].target.__fboLayer) es[i].target.__fboLayer.vis = es[i].isIntersecting;
  }, { rootMargin: '160px' });

  function makeLayer(drag) {
    var L = { el: null, ctx: null, w: 0, h: 0, dpr: 1, vis: true, px: 0, py: 0, inside: false, down: false, yaw: 0.6, pitch: -0.32, vyaw: 0, lx: 0, ly: 0, on: {}, stamp: '' };
    L.on.pointermove = function (e) {
      L.px = e.offsetX; L.py = e.offsetY; L.inside = true;
      if (L.down && drag) {
        var dx = e.clientX - L.lx, dy = e.clientY - L.ly;
        L.lx = e.clientX; L.ly = e.clientY;
        L.yaw += dx * 0.011; L.vyaw = dx * 0.011;
        L.pitch = Math.max(-1.2, Math.min(1.2, L.pitch + dy * 0.011));
      }
    };
    L.on.pointerdown = function (e) {
      L.down = true; L.inside = true; L.px = e.offsetX; L.py = e.offsetY; L.lx = e.clientX; L.ly = e.clientY;
      if (drag && L.el && L.el.setPointerCapture) { try { L.el.setPointerCapture(e.pointerId); } catch (err) {} }
    };
    L.on.pointerup = function (e) { L.down = false; if (e.pointerType !== 'mouse') L.inside = false; };
    L.on.pointercancel = function () { L.down = false; L.inside = false; };
    L.on.pointerleave = function () { if (!L.down) L.inside = false; };
    return L;
  }
  function hold(L, el) {
    if (L.el === el) return;
    var k;
    if (L.el) { for (k in L.on) L.el.removeEventListener(k, L.on[k]); io.unobserve(L.el); L.el.__fboLayer = null; }
    L.el = el || null; L.stamp = ''; L.down = false; L.inside = false;
    if (el) { L.ctx = el.getContext('2d'); el.__fboLayer = L; L.vis = true; for (k in L.on) el.addEventListener(k, L.on[k]); io.observe(el); }
  }
  function fit(L) {
    var cw = L.el.clientWidth, ch = L.el.clientHeight;
    if (!cw || !ch) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = Math.round(cw * dpr), H = Math.round(ch * dpr);
    if (L.el.width !== W || L.el.height !== H) { L.el.width = W; L.el.height = H; }
    L.w = cw; L.h = ch; L.dpr = dpr;
    L.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }
  function readTheme() {
    var r = logic.root.current; if (!r) return;
    var cs = getComputedStyle(r);
    function v(n, d) { var s = cs.getPropertyValue(n).trim(); return s || d; }
    E.col = { ink: v('--ink', '#E7E2D3'), mute: v('--mute', '#8FA6A4'), accent: v('--accent', '#C2A8FF'), bg: v('--bg', '#08191D'), shade: v('--shade', '8,25,29') };
    E.themeDirty = false;
  }
  function loadImage(url, done) {
    var im = new Image();
    im.onload = function () { done(im); };
    im.onerror = function () { done(null); };
    im.src = url;
  }

  /* ----- text that resolves out of ASCII ----- */
  var fx = [];
  /* a focused control's text is its accessible name, so it never scrambles while focused (a focused container around
     the decoded element, e.g. the dialog scroller, doesn't stop the effect inside it) */
  function named(n, el) { var f = document.activeElement; return !!f && f !== document.body && f.contains(n) && (f === el || !f.contains(el)); }
  function decode(el, dur) {
    if (!el || calm.matches) return;
    var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n, k = 0, now = performance.now();
    while ((n = tw.nextNode())) {
      var s = n.nodeValue;
      if (!s || !s.trim()) continue;
      var p = n.parentNode;
      if (!p || !p.closest || p.closest('[data-nofx]') || named(n, el)) continue;
      if (fx.some(function (f) { return f.node === n; })) continue;
      var rnd = new Float32Array(s.length);
      for (var j = 0; j < s.length; j++) rnd[j] = Math.random();
      fx.push({ node: n, root: el, orig: s, last: n.nodeValue, rnd: rnd, t0: now + Math.min(k, 16) * 30, dur: dur });
      k++;
    }
  }
  function stepFx(now) {
    var flick = Math.floor(now / 70);
    for (var i = fx.length - 1; i >= 0; i--) {
      var f = fx[i];
      if (f.node.nodeValue !== f.last || !f.node.isConnected) { fx.splice(i, 1); continue; }
      var p = (now - f.t0) / f.dur;
      if (p >= 1 || named(f.node, f.root)) { f.node.nodeValue = f.orig; fx.splice(i, 1); continue; }
      if (p < 0) p = 0;
      var out = '', len = f.orig.length;
      for (var j = 0; j < len; j++) {
        var c = f.orig.charAt(j);
        out += p > f.rnd[j] * 0.75 + (j / len) * 0.25 ? c : scrChar(c, hash2(j + flick * 7.3, f.rnd[j] * 91));
      }
      if (out !== f.last) f.node.nodeValue = f.last = out;
    }
  }
  function endFx() { for (var i = 0; i < fx.length; i++) if (fx[i].node.nodeValue === fx[i].last) fx[i].node.nodeValue = fx[i].orig; fx.length = 0; }

  /* ----- sections: ghost reveal (once), ASCII rain, ASCII light, hero tilt ----- */
  var secs = [], hdr = logic.root.current && logic.root.current.querySelector('header');
  var ro = new IntersectionObserver(function (es) {
    for (var i = 0; i < es.length; i++) {
      var e = es[i], o = e.target.__fboSec; if (!o) continue;
      o.vis = e.isIntersecting;
      if (!o.shown && inView(e.intersectionRect.height, e.rootBounds ? e.rootBounds.height : innerHeight, e.boundingClientRect.height)) show(o);
    }
  /* ponytail: 1% steps fire the rule within ~1% of a section's height (≈30px on a 3000px one); exact edges would need per-section rootMargin observers */
  }, { threshold: Array.from({ length: 101 }, function (_, j) { return j / 100; }), rootMargin: -(hdr ? hdr.offsetHeight : 0) + 'px 0px 0px 0px' }); /* what sits under the sticky header isn't on screen */
  function show(o) {
    o.shown = true;
    o.el.removeAttribute('data-fx');
    if (!calm.matches) { pin(o); o.veil = 1; decode(o.el, 950); }
  }
  /* scrambled glyphs wrap differently (phones), so the section keeps its height while its text plays and nothing below jumps */
  function pin(o) {
    if (!o.el.style.height) o.el.style.height = o.el.getBoundingClientRect().height + 'px';
    clearTimeout(o.pin); o.pin = setTimeout(function () { o.el.style.height = ''; }, 1500);
  }
  function scan() {
    var r = logic.root.current; if (!r) return;
    var list = r.querySelectorAll('[data-sec]');
    for (var i = 0; i < list.length; i++) {
      var el = list[i]; if (el.__fboSec) continue;
      var o = { el: el, cv: el.querySelector('canvas[data-amb]'), hero: el.getAttribute('data-sec') === 'hero', px: 0, py: 0, sx: 0, sy: 0, inside: false, li: 0, veil: 0, shown: false, vis: false, drops: [] };
      el.__fboSec = o; secs.push(o);
      if (o.hero) heroO = o;
      if (el.getAttribute('data-sec') === 'about') aboutO = o;
      o.move = (function (o) { return function (e) {
        var b = o.el.getBoundingClientRect();
        o.px = e.clientX - b.left; o.py = e.clientY - b.top;
        if (!o.inside) { o.sx = o.px; o.sy = o.py; }
        o.inside = true;
        var st = o.el.style, nx = o.px / b.width - 0.5, ny = o.py / b.height - 0.5;
        st.setProperty('--mx', o.px.toFixed(0) + 'px'); st.setProperty('--my', o.py.toFixed(0) + 'px');
        if (!calm.matches && e.pointerType === 'mouse') {
          var tl = logic.tilt.current;
          if (o.hero && tl) tl.style.transform = 'perspective(1100px) rotateY(' + (nx * 7).toFixed(2) + 'deg) rotateX(' + (-ny * 6).toFixed(2) + 'deg)';
        }
      }; })(o);
      o.leave = (function (o) { return function () { o.inside = false; var tl = logic.tilt.current; if (o.hero && tl) tl.style.transform = ''; }; })(o);
      o.focus = (function (o) { return function () { if (!o.shown) show(o); }; })(o);
      el.addEventListener('pointermove', o.move); el.addEventListener('pointerleave', o.leave); el.addEventListener('focusin', o.focus);
      if (!calm.matches) el.setAttribute('data-fx', 'wait');
      ro.observe(el);
    }
  }
  function drawAmbient(o, dt) {
    var cv = o.cv; if (!cv) return;
    var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    /* ponytail: the rain and the pointer light draw at 1 device pixel per CSS pixel (sections got taller in the 2026-11-19
       layout; the faint glyphs read the same). Ceiling: slightly soft rain on 2x screens; raise to 1.5 if that shows. */
    var dpr = 1, W = Math.round(w), H = Math.round(h);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var ctx = cv.getContext('2d'), still = calm.matches, i, k, x, y;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    ctx.font = monoFont(13, 450); ctx.textBaseline = 'top';
    var cw = ctx.measureText('M').width || 7.8, ch = 19, cols = Math.ceil(w / cw), rows = Math.ceil(h / ch);
    if (!still && E.rain > 0) {
      var want = Math.round(cols / 5.5 * E.rain);
      while (o.drops.length < want) o.drops.push({ c: Math.floor(Math.random() * cols), y: Math.random() * h, v: 22 + Math.random() * 64, n: 2 + Math.floor(Math.random() * 7), s: Math.random() * 100 });
      if (o.drops.length > want) o.drops.length = want;
      ctx.fillStyle = E.col.mute;
      for (i = 0; i < o.drops.length; i++) {
        var d = o.drops[i];
        d.y += d.v * dt * Math.max(0.2, E.speed);
        if (d.y - d.n * ch > h || d.c >= cols) { d.c = Math.floor(Math.random() * cols); d.y = -Math.random() * 160; d.v = 22 + Math.random() * 64; d.n = 2 + Math.floor(Math.random() * 7); }
        var head = Math.floor(d.y / ch);
        for (k = 0; k < d.n; k++) {
          var r = head - k; if (r < 0 || r >= rows) continue;
          ctx.globalAlpha = 0.26 * (1 - k / d.n);
          ctx.fillText(RAMP.charAt(1 + Math.floor(hash2(d.s + r * 3.1, d.c + Math.floor(E.t * 2 + k)) * 9)), d.c * cw, r * ch);
        }
      }
    }
    /* light: a small, faint cloud of glyphs that trails the pointer */
    o.li += ((o.inside ? 1 : 0) - o.li) * (still ? 1 : 1 - Math.pow(0.01, dt));
    var kk = still ? 1 : 1 - Math.pow(0.002, dt);
    o.sx += (o.px - o.sx) * kk; o.sy += (o.py - o.sy) * kk;
    if (o.li > 0.02 && E.light > 0) {
      var R = 64, c0 = Math.max(0, Math.floor((o.sx - R) / cw)), c1 = Math.min(cols - 1, Math.ceil((o.sx + R) / cw));
      var r0 = Math.max(0, Math.floor((o.sy - R) / ch)), r1 = Math.min(rows - 1, Math.ceil((o.sy + R) / ch));
      ctx.fillStyle = E.col.accent;
      for (y = r0; y <= r1; y++) for (x = c0; x <= c1; x++) {
        var gx = (x + 0.5) * cw - o.sx, gy = (y + 0.5) * ch - o.sy, a = 1 - Math.sqrt(gx * gx + gy * gy) / R;
        if (a <= 0) continue;
        var v = a * (0.3 + 0.7 * vnoise(x * 0.33 + E.t * 0.7, y * 0.33 - E.t * 0.5));
        if (v < 0.16) continue;
        ctx.globalAlpha = Math.min(0.4, (0.02 + 0.1 * a) * o.li * E.light);
        ctx.fillText(RAMP.charAt(1 + Math.floor(v * (RL - 2))), x * cw, y * ch);
      }
    }
    if (o.veil > 0) {
      o.veil = Math.max(0, o.veil - dt / 1.2);
      ctx.fillStyle = E.col.ink; ctx.globalAlpha = 0.34 * o.veil;
      for (y = 0; y < rows; y++) {
        var s = '';
        for (x = 0; x < cols; x++) s += hash2(x * 1.7, y * 2.3) < o.veil * 0.62 ? RAMP.charAt(1 + Math.floor(hash2(x + tick, y - tick) * (RL - 1))) : ' ';
        ctx.fillText(s, 0, y * ch);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ----- avatar: the INKWILD portrait, head and shoulders, set in ASCII ----- */
  var A = makeLayer(false), aMap = null, aGrid = null;
  var aIntro = 0, aBoil = 0, aBoilAt = 0, aSx = 0.5, aSy = 0.4, heroO = null;
  loadImage(MAP_URL, function (im) {
    if (!im) return;
    try {
      var c = document.createElement('canvas'); c.width = 264; c.height = 264;
      var g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(im, 0, 0, 264, 264);
      aMap = g.getImageData(0, 0, 264, 264).data;
      A.stamp = '';
    } catch (err) { aMap = null; }
  });
  function buildAvatar() {
    var fs = E.glyph, ctx = A.ctx;
    ctx.font = monoFont(fs);
    var cw = ctx.measureText('M').width || fs * 0.6, ch = fs * 1.08;
    var side = Math.min(A.w, A.h);
    var cols = Math.max(8, Math.floor(side / cw)), rows = Math.max(8, Math.floor(side / ch));
    var dens = new Float32Array(cols * rows), x, y, i, j;
    for (y = 0; y < rows; y++) {
      var y0 = Math.floor(y * 264 / rows), y1 = Math.max(y0 + 1, Math.floor((y + 1) * 264 / rows));
      for (x = 0; x < cols; x++) {
        var x0 = Math.floor(x * 264 / cols), x1 = Math.max(x0 + 1, Math.floor((x + 1) * 264 / cols));
        var T = 0, G = 0, R = 0, Al = 0, n = 0;
        for (j = y0; j < y1; j++) for (i = x0; i < x1; i++) { var o = (j * 264 + i) * 4; T += aMap[o]; G += aMap[o + 1]; R += aMap[o + 2]; Al += aMap[o + 3]; n++; }
        T /= n * 255; G /= n * 255; R /= n * 255; Al /= n * 255;
        var v;
        if (E.dark) { v = Math.pow(clamp01((T - 0.06) / 0.86), 1.15); if (R < 0.25) v = Math.max(v, 0.17) + G * 0.1; }
        else { v = Math.pow(clamp01((0.97 - T) / 0.8), 0.9); }
        dens[y * cols + x] = clamp01(v) * Al;
      }
    }
    var frames = [];
    for (var f = 0; f < 3; f++) {
      var tiers = [[], [], []];
      for (y = 0; y < rows; y++) {
        var s0 = '', s1 = '', s2 = '';
        for (x = 0; x < cols; x++) {
          var d = dens[y * cols + x], idx = Math.floor(d * (RL - 0.01));
          if (f > 0 && d > 0.04 && d < 0.96 && hash2(x + f * 37.1, y + f * 11.7) < 0.3) idx += hash2(y + f, x) > 0.5 ? 1 : -1;
          if (idx < 0) idx = 0; if (idx > RL - 1) idx = RL - 1;
          var chr = RAMP.charAt(idx), tier = d < 0.3 ? 0 : d < 0.62 ? 1 : 2;
          s0 += tier === 0 ? chr : ' '; s1 += tier === 1 ? chr : ' '; s2 += tier === 2 ? chr : ' ';
        }
        tiers[0].push(s0); tiers[1].push(s1); tiers[2].push(s2);
      }
      frames.push(tiers);
    }
    aGrid = { cols: cols, rows: rows, cw: cw, ch: ch, fs: fs, dens: dens, frames: frames, ox: (A.w - cols * cw) / 2, oy: (A.h - rows * ch) / 2 };
  }
  function drawAvatar(now, dt) {
    if (!fit(A)) return;
    var ctx = A.ctx, w = A.w, h = A.h, still = calm.matches;
    ctx.clearRect(0, 0, w, h);
    if (!aMap) return;
    var stamp = w + 'x' + h + (E.dark ? 'd' : 'l') + E.glyph;
    if (stamp !== A.stamp) { buildAvatar(); A.stamp = stamp; }
    var g = aGrid, cols = g.cols, rows = g.rows, cw = g.cw, ch = g.ch, x, y, d, idx;
    aIntro = still ? 1 : clamp01(aIntro + (!heroO || heroO.shown ? dt / 1.6 : 0)); /* builds with the hero's reveal */
    if (!still && now - aBoilAt > 170 / Math.max(0.25, E.speed) && E.speed > 0) { aBoil = (aBoil + 1) % 3; aBoilAt = now; }
    var tx = A.inside ? A.px / w : 0.5 + 0.2 * Math.cos(E.t * 0.45), ty = A.inside ? A.py / h : 0.42 + 0.14 * Math.sin(E.t * 0.6);
    var k = still ? 1 : 1 - Math.pow(0.0015, dt);
    aSx += (tx - aSx) * k; aSy += (ty - aSy) * k;
    var cx = aSx * w, cy = aSy * h;

    ctx.font = monoFont(g.fs); ctx.textBaseline = 'top'; ctx.fillStyle = E.col.ink;
    var tiers = g.frames[aBoil], alphas = [0.5, 0.78, 1];
    if (aIntro < 1) {
      for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
        d = g.dens[y * cols + x]; if (d < 0.02) continue;
        var gate = hash2(x * 1.3, y * 0.7) * 0.75 + (y / rows) * 0.25;
        if (gate > aIntro * 1.2) { if (hash2(x + tick, y) > 0.55) { ctx.globalAlpha = 0.34; ctx.fillText(RAMP.charAt(1 + Math.floor(hash2(x, y + tick) * (RL - 1))), g.ox + x * cw, g.oy + y * ch); } continue; }
        ctx.globalAlpha = alphas[d < 0.3 ? 0 : d < 0.62 ? 1 : 2];
        ctx.fillText(RAMP.charAt(Math.floor(d * (RL - 0.01))), g.ox + x * cw, g.oy + y * ch);
      }
    } else {
      for (var tr = 0; tr < 3; tr++) { ctx.globalAlpha = alphas[tr]; for (y = 0; y < rows; y++) ctx.fillText(tiers[tr][y], g.ox, g.oy + y * ch); }
    }
    ctx.globalAlpha = 1;
    /* accent: brighter glyphs only where the pointer is (it drifts on its own when nobody points) */
    var band = 0.12 * w;
    var c0 = Math.max(0, Math.floor((cx - band - g.ox) / cw)), c1 = Math.min(cols - 1, Math.ceil((cx + band - g.ox) / cw));
    var r0 = Math.max(0, Math.floor((cy - band - g.oy) / ch)), r1 = Math.min(rows - 1, Math.ceil((cy + band - g.oy) / ch));
    ctx.fillStyle = E.col.accent;
    for (y = r0; y <= r1; y++) for (x = c0; x <= c1; x++) {
      d = g.dens[y * cols + x]; if (d < 0.03) continue;
      var gx = g.ox + (x + 0.5) * cw - cx, gy = g.oy + (y + 0.5) * ch - cy;
      var bd = 1 - Math.sqrt(gx * gx + gy * gy) / band;
      if (bd <= 0) continue;
      idx = Math.floor(d * (RL - 0.01)) + Math.round(bd * 3);
      if (!still && hash2(x + tick * 0.37, y - tick * 0.11) < 0.04) idx = 1 + Math.floor(hash2(x - tick, y + tick) * (RL - 1));
      if (idx > RL - 1) idx = RL - 1;
      ctx.globalAlpha = Math.pow(bd, 1.4) * 0.95;
      ctx.fillText(RAMP.charAt(idx), g.ox + x * cw, g.oy + y * ch);
    }
    ctx.globalAlpha = 1;
  }

  /* ----- one raymarched ASCII object, used by the service stage and the work covers ----- */
  function renderObject(ctx, w, h, fs, yaw, pitch, A0, B0, mixE, T, lit, lpx, lpy, zoom) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = monoFont(fs); ctx.textBaseline = 'top';
    var cw = ctx.measureText('M').width || fs * 0.6, ch = fs * 1.08;
    var cols = Math.floor(w / cw), rows = Math.floor(h / ch), ox = (w - cols * cw) / 2, oy = (h - rows * ch) / 2;
    if (cols < 4 || rows < 4) return;
    var cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    function scene(x, y, z) {
      var d = sdf(B0, x, y, z, T);
      return mixE < 1 ? sdf(A0, x, y, z, T) * (1 - mixE) + d * mixE : d;
    }
    function ox3(x, y, z) { var z1 = -y * sp + z * cp; return x * cyw + z1 * syw; }
    function oy3(x, y, z) { return y * cp + z * sp; }
    function oz3(x, y, z) { var z1 = -y * sp + z * cp; return -x * syw + z1 * cyw; }
    var lx = -0.62, ly = 0.72, lz = -0.9;
    if (lit) { lx = (lpx / w * 2 - 1) * 1.3; ly = -(lpy / h * 2 - 1) * 1.3; lz = -0.85; }
    var ll = Math.sqrt(lx * lx + ly * ly + lz * lz); lx /= ll; ly /= ll; lz /= ll;
    var Lx = ox3(lx, ly, lz), Ly = oy3(lx, ly, lz), Lz = oz3(lx, ly, lz);
    var rox = ox3(0, 0, -3.4), roy = oy3(0, 0, -3.4), roz = oz3(0, 0, -3.4);
    var asp = (cols * cw) / (rows * ch), e = 0.012, fov = zoom, ax = asp > 1 ? fov * asp : fov, ay = asp > 1 ? fov : fov / asp;
    var rowsT = [[], [], [], []];
    for (var y = 0; y < rows; y++) {
      var s0 = '', s1 = '', s2 = '', s3 = '';
      var v = (1 - (y + 0.5) / rows * 2) * ay;
      for (var x = 0; x < cols; x++) {
        var u = ((x + 0.5) / cols * 2 - 1) * ax;
        var dl = Math.sqrt(u * u + v * v + 3.61), vx = u / dl, vy = v / dl, vz = 1.9 / dl;
        var dx = ox3(vx, vy, vz), dy = oy3(vx, vy, vz), dz = oz3(vx, vy, vz);
        var bq = rox * dx + roy * dy + roz * dz, cq = rox * rox + roy * roy + roz * roz - 1.69, disc = bq * bq - cq;
        var chr = ' ', tier = 0;
        if (disc > 0) {
          var sq = Math.sqrt(disc), t = -bq - sq, t1 = -bq + sq, minD = 9, hit = false, px = 0, py = 0, pz = 0, dd = 0;
          for (var i = 0; i < 30 && t < t1; i++) {
            px = rox + dx * t; py = roy + dy * t; pz = roz + dz * t;
            dd = scene(px, py, pz);
            if (dd < minD) minD = dd;
            if (dd < 0.01) { hit = true; break; }
            t += dd;
          }
          if (hit) {
            var n1 = scene(px + e, py - e, pz - e), n2 = scene(px - e, py - e, pz + e), n3 = scene(px - e, py + e, pz - e), n4 = scene(px + e, py + e, pz + e);
            var nx = n1 - n2 - n3 + n4, ny = -n1 - n2 + n3 + n4, nz = -n1 + n2 - n3 + n4;
            var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= nl; ny /= nl; nz /= nl;
            var diff = nx * Lx + ny * Ly + nz * Lz; if (diff < 0) diff = 0;
            var facing = -(nx * dx + ny * dy + nz * dz); if (facing < 0) facing = 0;
            var lum = (0.1 + 0.9 * diff) * (1 - 0.72 * Math.pow(1 - facing, 1.6));
            var hx = Lx - dx, hy = Ly - dy, hz = Lz - dz, hl = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1;
            var spec = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), 26);
            lum = clamp01(lum + spec * 0.5);
            chr = RAMP.charAt(1 + Math.floor(lum * (RL - 1.01))); tier = spec > 0.42 ? 3 : lum < 0.3 ? 0 : lum < 0.6 ? 1 : 2;
          } else if (minD < 0.1) {
            chr = minD < 0.04 ? "'" : '.'; tier = 0;
          }
        }
        s0 += tier === 0 ? chr : ' '; s1 += tier === 1 ? chr : ' '; s2 += tier === 2 ? chr : ' '; s3 += tier === 3 ? chr : ' ';
      }
      rowsT[0].push(s0); rowsT[1].push(s1); rowsT[2].push(s2); rowsT[3].push(s3);
    }
    var al = [0.5, 0.78, 1, 1];
    for (var tr = 0; tr < 4; tr++) {
      ctx.globalAlpha = al[tr]; ctx.fillStyle = tr === 3 ? E.col.accent : E.col.ink;
      for (var r = 0; r < rows; r++) ctx.fillText(rowsT[tr][r], ox, oy + r * ch);
    }
    ctx.globalAlpha = 1;
  }
  var S = makeLayer(true), sFrom = 0, sTo = 0, sMix = 1;
  function drawStage(now, dt) {
    if (!fit(S)) return;
    var still = calm.matches;
    if (E.svc !== sTo) { sFrom = sMix < 0.5 ? sFrom : sTo; sTo = E.svc; sMix = still ? 1 : 0; }
    if (sMix < 1) sMix = Math.min(1, sMix + dt / 0.7);
    if (!S.down) { S.yaw += S.vyaw; S.vyaw *= 0.93; if (!still) S.yaw += dt * 0.32 * E.speed; }
    renderObject(S.ctx, S.w, S.h, Math.max(E.glyph + 2, Math.round(S.w / 40)), S.yaw, S.pitch, sFrom, sTo, sMix * sMix * (3 - 2 * sMix), E.t, S.inside && !S.down, S.px, S.py, 0.6);
  }
  /* covers: each project card gets its own slowly turning object (hover doesn't change it: the card's hover is the scramble) */
  var covers = [], coverAt = 0;
  function scanCovers() {
    var r = logic.root.current; if (!r) return;
    var list = r.querySelectorAll('canvas[data-cover]');
    for (var j = 0; j < covers.length; j++) if (!covers[j].isConnected) io.unobserve(covers[j]); /* a closed project view's cover */
    covers.length = 0;
    for (var i = 0; i < list.length; i++) {
      var cv = list[i];
      if (!cv.__fboC) { cv.__fboC = { yaw: 0.5 + i * 0.9, drawn: false, vis: true }; cv.__fboLayer = cv.__fboC; io.observe(cv); } /* io sets .vis */
      covers.push(cv);
    }
  }
  function drawCover(cv, dt, force) {
    var st = cv.__fboC, w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    if (!st.vis) return;
    var big = cv.hasAttribute('data-big');
    if (!force && !big && st.drawn && calm.matches) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5), W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!calm.matches) st.yaw += dt * (big ? 1.1 : 0.35) * E.speed;
    var k = parseInt(cv.getAttribute('data-cover'), 10) || 0;
    /* the glyph grows with the cover (about 100 columns), so a bigger cover costs about twice a 2026-11-18 card cover, not five times */
    renderObject(ctx, w, h, Math.max(big ? 11 : 9, Math.round(w / 60)), st.yaw, -0.34, k, k, 1, E.t, false, 0, 0, big ? 0.5 : 0.52);
    st.drawn = true;
  }
  function drawCovers(dt) {
    if (!covers.length) return;
    var n = covers.length, done = -1;
    coverAt = (coverAt + 1) % n; drawCover(covers[coverAt], dt * n, false); done = coverAt;
    for (var i = 0; i < n; i++) {
      if (i === done) continue;
      var cv = covers[i];
      if (cv.hasAttribute('data-big') || !cv.__fboC.drawn) drawCover(cv, dt, true);
    }
  }

  /* ----- about: the real photo; its edges dissolve into ASCII ----- */
  var Ph = makeLayer(false), pImg = null, pGrid = null, pBuf = document.createElement('canvas'), pIntro = 0, pHov = 0, pCx = 0.5, pCy = 0.5, aboutO = null;
  /* the photo is fetched once it comes within a screen of the viewport, not at startup (bind() observes it) */
  var pNear = new IntersectionObserver(function (es) {
    if (!es.some(function (e) { return e.isIntersecting; })) return;
    pNear.disconnect(); pNear = null;
    loadImage(PHOTO_URL, function (im) { pImg = im; Ph.stamp = ''; });
  }, { rootMargin: '0px 0px 100% 0px' });
  function buildPhotoGrid() {
    var fs = Math.max(8, E.glyph - 1), ctx = Ph.ctx, i, x, y, j, k;
    ctx.font = monoFont(fs);
    var cw = ctx.measureText('M').width || fs * 0.6, ch = fs * 1.08, side = Math.min(Ph.w, Ph.h);
    var cols = Math.max(8, Math.floor(side / cw)), rows = Math.max(8, Math.floor(side / ch));
    var c = document.createElement('canvas'); c.width = cols; c.height = rows;
    var g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(pImg, 0, 0, cols, rows);
    var px = g.getImageData(0, 0, cols, rows).data, n = cols * rows, lum = new Float32Array(n), al = new Float32Array(n), halo = new Float32Array(n), lo = 1, hi = 0;
    for (i = 0; i < n; i++) {
      al[i] = px[i * 4 + 3] / 255;
      lum[i] = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
      if (al[i] > 0.6) { if (lum[i] < lo) lo = lum[i]; if (lum[i] > hi) hi = lum[i]; }
    }
    for (i = 0; i < n; i++) lum[i] = clamp01((lum[i] - lo) / Math.max(0.05, hi - lo));
    for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
      var m = 0;
      if (al[y * cols + x] <= 0.05) for (j = -3; j <= 3; j++) for (k = -3; k <= 3; k++) {
        var yy = y + j, xx = x + k; if (yy < 0 || yy >= rows || xx < 0 || xx >= cols) continue;
        var f = al[yy * cols + xx] * (1 - Math.sqrt(j * j + k * k) / 4.5); if (f > m) m = f;
      }
      halo[y * cols + x] = hash2(x * 3.1, y * 1.7) > 0.45 ? m * 0.3 : 0;
    }
    pGrid = { cols: cols, rows: rows, cw: cw, ch: ch, fs: fs, lum: lum, al: al, halo: halo, side: side, ix: (Ph.w - side) / 2, iy: (Ph.h - side) / 2, ox: (Ph.w - cols * cw) / 2, oy: (Ph.h - rows * ch) / 2 };
  }
  function drawPhoto(now, dt) {
    if (!fit(Ph)) return;
    var ctx = Ph.ctx, w = Ph.w, h = Ph.h, still = calm.matches;
    ctx.clearRect(0, 0, w, h);
    if (!pImg) return;
    var stamp = w + 'x' + h + 'g' + E.glyph;
    if (stamp !== Ph.stamp) { buildPhotoGrid(); Ph.stamp = stamp; }
    var g = pGrid, shown = !aboutO || aboutO.shown;
    pIntro = still ? 1 : clamp01(pIntro + (shown ? dt / 1.6 : 0));
    pHov += ((Ph.inside ? 1 : 0) - pHov) * (still ? 1 : 1 - Math.pow(0.03, dt));
    var kk = still ? 1 : 1 - Math.pow(0.01, dt);
    var tx = Ph.inside ? 0.5 + (Ph.px / w - 0.5) * 0.16 : 0.5, ty = Ph.inside ? 0.56 + (Ph.py / h - 0.5) * 0.1 : 0.56;
    pCx += (tx - pCx) * kk; pCy += (ty - pCy) * kk;
    var ease = 1 - Math.pow(1 - pIntro, 3), sc = ease * (1 + 0.1 * pHov + (still ? 0 : 0.015 * Math.sin(E.t * 0.8)));
    var cx = g.ix + pCx * g.side, cy = g.iy + pCy * g.side, rx = Math.max(1, 0.56 * g.side * sc), ry = Math.max(1, 0.6 * g.side * sc);
    /* the photo, darkened toward its edge, then faded out */
    if (sc > 0.03) {
      if (pBuf.width !== Ph.el.width || pBuf.height !== Ph.el.height) { pBuf.width = Ph.el.width; pBuf.height = Ph.el.height; }
      var b = pBuf.getContext('2d');
      b.setTransform(Ph.dpr, 0, 0, Ph.dpr, 0, 0);
      b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, w, h);
      b.drawImage(pImg, g.ix, g.iy, g.side, g.side);
      b.save(); b.translate(cx, cy); b.scale(1, ry / rx);
      b.globalCompositeOperation = 'source-atop';
      var sh = b.createRadialGradient(0, 0, rx * 0.45, 0, 0, rx);
      sh.addColorStop(0, 'rgba(' + E.col.shade + ',0)'); sh.addColorStop(1, 'rgba(' + E.col.shade + ',' + (E.dark ? 0.86 : 0.5) + ')');
      b.fillStyle = sh; b.fillRect(-1e4, -1e4, 2e4, 2e4);
      b.globalCompositeOperation = 'destination-in';
      var mk = b.createRadialGradient(0, 0, rx * 0.58, 0, 0, rx * 0.97);
      mk.addColorStop(0, 'rgba(0,0,0,1)'); mk.addColorStop(1, 'rgba(0,0,0,0)');
      b.fillStyle = mk; b.fillRect(-1e4, -1e4, 2e4, 2e4);
      b.restore();
      b.globalCompositeOperation = 'destination-in';
      var vf = b.createLinearGradient(0, g.iy + g.side * 0.8, 0, g.iy + g.side);
      vf.addColorStop(0, 'rgba(0,0,0,1)'); vf.addColorStop(1, 'rgba(0,0,0,0)');
      b.fillStyle = vf; b.fillRect(0, 0, w, h);
      b.globalCompositeOperation = 'source-over';
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(pBuf, 0, 0); ctx.setTransform(Ph.dpr, 0, 0, Ph.dpr, 0, 0);
    }
    /* the ASCII takes over where the photo lets go */
    ctx.font = monoFont(g.fs); ctx.textBaseline = 'top';
    var cols = g.cols, rows = g.rows, flick = Math.floor(now / 120), T = [[], [], [], [], []], x, y, q;
    for (y = 0; y < rows; y++) {
      var s0 = '', s1 = '', s2 = '', s3 = '', s4 = '', dy = (g.oy + (y + 0.5) * g.ch - cy) / ry;
      for (x = 0; x < cols; x++) {
        var i = y * cols + x, a = g.al[i] > 0.04 ? g.al[i] : g.halo[i], chr = ' ', t = -1;
        if (a > 0.02) {
          var fxp = (x + 0.5) / cols, edge = smooth(0, 0.2, 1 - (y + 0.5) / rows) * smooth(0, 0.12, fxp) * smooth(0, 0.12, 1 - fxp);
          var dx = (g.ox + (x + 0.5) * g.cw - cx) / rx, d = sc > 0.03 ? Math.sqrt(dx * dx + dy * dy) : 9, v = a * smooth(0.52, 0.94, d) * edge;
          if (v > 0.05 && hash2(x * 0.71 + 3.3, y * 1.37 + 7.1) < 0.3 + v * 0.95) {
            var l = g.lum[i], dens = Math.min(0.8, E.dark ? Math.max(Math.pow(l, 1.1), 0.18) : Math.max(Math.pow(1 - l, 0.95), 0.15)), idx = 1 + Math.floor(dens * (RL - 1.01));
            if (!still && hash2(x + flick * 0.31, y - flick * 0.17) < 0.1) idx = 1 + Math.floor(hash2(x - flick, y + flick) * (RL - 1));
            chr = RAMP.charAt(Math.min(RL - 1, idx));
            var ring = 1 - Math.abs(d - 0.76) / 0.15;
            t = ring > 0 && hash2(x * 1.7 + flick * 0.13, y * 2.3) < ring * (0.14 + 0.3 * pHov) ? 4 : v < 0.3 ? 0 : v < 0.55 ? 1 : v < 0.8 ? 2 : 3;
          }
        }
        s0 += t === 0 ? chr : ' '; s1 += t === 1 ? chr : ' '; s2 += t === 2 ? chr : ' '; s3 += t === 3 ? chr : ' '; s4 += t === 4 ? chr : ' ';
      }
      T[0].push(s0); T[1].push(s1); T[2].push(s2); T[3].push(s3); T[4].push(s4);
    }
    var alf = [0.3, 0.52, 0.76, 0.95, 0.9];
    for (q = 0; q < 5; q++) { ctx.globalAlpha = alf[q]; ctx.fillStyle = q === 4 ? E.col.accent : E.col.ink; for (y = 0; y < rows; y++) ctx.fillText(T[q][y], g.ox, g.oy + y * g.ch); }
    ctx.globalAlpha = 1;
  }

  /* ----- globe: skills in 3D; a picked group gathers at the front ----- */
  var Gl = makeLayer(true), gPts = [], gSeed = false, gMix = 0;
  (function () {
    var n = SKILLS.length;
    for (var i = 0; i < n; i++) {
      var y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), ph = i * 2.399963;
      gPts.push({ x: Math.cos(ph) * r, y: y * 0.9, z: Math.sin(ph) * r, label: SKILLS[i][0], cat: SKILLS[i][1], vx: 0, vy: 0, vz: 0, sx: 0, sy: 0, slot: 0, of: 1 });
    }
  })();
  Gl.pitch = -0.18;
  function slotGroup() {
    var n = 0, i;
    for (i = 0; i < gPts.length; i++) if (gPts[i].cat === E.cat) n++;
    var k = 0;
    for (i = 0; i < gPts.length; i++) if (gPts[i].cat === E.cat) { gPts[i].slot = k++; gPts[i].of = n; }
  }
  function drawGlobe(now, dt) {
    if (!fit(Gl)) return;
    var ctx = Gl.ctx, w = Gl.w, h = Gl.h, still = calm.matches, group = E.cat !== 'all';
    ctx.clearRect(0, 0, w, h);
    gMix += ((group ? 1 : 0) - gMix) * (still ? 1 : 1 - Math.pow(0.02, dt));
    if (!Gl.down) { Gl.yaw += Gl.vyaw; Gl.vyaw *= 0.94; if (!still) Gl.yaw += dt * 0.16 * E.speed * (group ? 0.45 : 1); }
    var cyw = Math.cos(Gl.yaw), syw = Math.sin(Gl.yaw), cp = Math.cos(Gl.pitch), sp = Math.sin(Gl.pitch);
    var cx = w / 2, cy = h / 2, Rx = Math.min(w * 0.36, 430), Ry = Math.min(h * 0.4, 220), scale = Math.max(0.74, Math.min(1.08, w / 900));
    var i, p, kk = still ? 1 : 1 - Math.pow(0.012, dt);
    ctx.font = monoFont(Math.round(11 * scale)); ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillStyle = E.col.mute;
    for (var la = -75; la <= 75; la += 15) {
      var cl = Math.cos(la * Math.PI / 180), sl = Math.sin(la * Math.PI / 180);
      for (var lo = 0; lo < 360; lo += 10) {
        var a = lo * Math.PI / 180, x = Math.cos(a) * cl * 0.94, y = sl * 0.94, z = Math.sin(a) * cl * 0.94;
        var x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp, pk = 1 / (1 - z2 * 0.2);
        ctx.globalAlpha = (0.14 + 0.5 * smooth(-0.9, 1, z2)) * (1 - 0.55 * gMix);
        ctx.fillText(z2 > 0.45 ? ':' : '.', cx + x1 * Rx * pk, cy - y1 * Ry * pk);
      }
    }
    var order = [], near = null, nd = 70 * 70;
    for (i = 0; i < gPts.length; i++) {
      p = gPts[i];
      var rx = p.x * cyw + p.z * syw, rz1 = -p.x * syw + p.z * cyw, ry = p.y * cp - rz1 * sp, rz = p.y * sp + rz1 * cp;
      var tx = rx, ty = ry, tz = rz;
      if (group) {
        if (p.cat === E.cat) {
          var ang = -Math.PI / 2 + p.slot * Math.PI * 2 / p.of;
          tx = Math.cos(ang) * 0.6; ty = -Math.sin(ang) * 0.6 + (still ? 0 : 0.03 * Math.sin(E.t * 1.3 + p.slot)); tz = 0.82;
          if (p.of === 1) { tx = 0; ty = 0; }
        } else { tx = rx * 0.94; ty = ry * 0.94; tz = -Math.abs(rz) * 0.9 - 0.08; }
      }
      if (!gSeed) { p.vx = tx; p.vy = ty; p.vz = tz; }
      p.vx += (tx - p.vx) * kk; p.vy += (ty - p.vy) * kk; p.vz += (tz - p.vz) * kk;
      var k2 = 1 / (1 - p.vz * 0.2);
      p.sx = cx + p.vx * Rx * k2; p.sy = cy - p.vy * Ry * k2;
      order.push(p);
      if (Gl.inside && !Gl.down && p.vz > -0.1) { var ddx = p.sx - Gl.px, ddy = p.sy - Gl.py, d2 = ddx * ddx + ddy * ddy; if (d2 < nd) { nd = d2; near = p; } }
    }
    gSeed = true;
    order.sort(function (m, n) { return m.vz - n.vz; });
    for (i = 0; i < order.length; i++) {
      p = order[i];
      var depth = (p.vz + 1) / 2, on = !group || p.cat === E.cat, hot = p === near;
      var size = Math.round((11 + 7 * depth + (group && on ? 2 : 0)) * scale);
      ctx.font = monoFont(size, hot || (on && group) ? 600 : 450);
      ctx.globalAlpha = (0.1 + 0.9 * smooth(-0.5, 0.9, p.vz)) * (on ? 1 : 0.3);
      ctx.fillStyle = hot || (on && group) ? E.col.accent : E.col.ink;
      ctx.fillText(hot ? '[ ' + p.label + ' ]' : p.label, p.sx, p.sy);
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }

  /* ----- footer tide ----- */
  var Td = makeLayer(false);
  function drawTide() {
    if (!fit(Td)) return;
    var ctx = Td.ctx, w = Td.w, h = Td.h, t = E.t;
    ctx.clearRect(0, 0, w, h);
    ctx.font = monoFont(13, 450); ctx.textBaseline = 'top';
    var cw = ctx.measureText('M').width || 7.8, ch = 15, cols = Math.ceil(w / cw), rows = Math.ceil(h / ch), x, y, v, idx, lit = [];
    ctx.fillStyle = E.col.mute;
    for (y = 0; y < rows; y++) {
      var s = '', fy = y / rows;
      for (x = 0; x < cols; x++) {
        var swell = Math.sin(x * 0.07 + t * 0.7 + Math.sin(y * 0.55 + t * 0.3) * 1.4) * 0.5 + 0.5;
        v = clamp01(fy * 0.95 + (swell - 0.5) * 0.42 + (vnoise(x * 0.12, y * 0.4 + t * 0.2) - 0.5) * 0.35 - 0.12) * 0.82;
        var bump = 0;
        if (Td.inside) { var ddx = x * cw - Td.px, ddy = y * ch - Td.py; bump = Math.max(0, 1 - Math.sqrt(ddx * ddx + ddy * ddy) / 150); }
        idx = Math.floor(clamp01(v + bump * 0.22) * (RL - 0.01));
        if (bump > 0.25 && idx > 0) { lit.push(x, y, idx, bump); s += ' '; } else s += RAMP.charAt(idx);
      }
      ctx.globalAlpha = 0.3 + 0.6 * fy;
      ctx.fillText(s, 0, y * ch);
    }
    ctx.fillStyle = E.col.accent;
    for (var i = 0; i < lit.length; i += 4) { ctx.globalAlpha = 0.35 + 0.65 * lit[i + 3]; ctx.fillText(RAMP.charAt(lit[i + 2]), lit[i] * cw, lit[i + 1] * ch); }
    ctx.globalAlpha = 1;
  }

  /* ----- hover: anything marked data-scr scrambles and settles ----- */
  var rootEl = null;
  function onOver(e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-scr]') : null;
    if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) decode(t, 420);
  }
  function bind() {
    hold(A, logic.avatar.current); hold(S, logic.stage.current); hold(Gl, logic.globe.current); hold(Td, logic.tide.current); hold(Ph, logic.photo.current);
    if (pNear && Ph.el) pNear.observe(Ph.el);
    var r = logic.root.current;
    if (r !== rootEl) { if (rootEl) rootEl.removeEventListener('pointerover', onOver); rootEl = r; if (rootEl) rootEl.addEventListener('pointerover', onOver); }
    scan(); scanCovers();
  }
  /* ponytail: every layer draws with fillText on the main thread (whole rows where it can). Ceiling: about 3-7 ms per
     draw on a fast Mac, so several times that on a mid-range phone. Upgrade path: a glyph atlas (RAMP pre-rendered per
     colour, blitted with drawImage), or this loop in an OffscreenCanvas worker. */
  /* one layer throwing doesn't stop the others; each logs once */
  var bad = {};
  function run(k, f, a, b) { try { f(a, b); } catch (err) { if (!bad[k]) { bad[k] = true; console.error('fbo engine: ' + k, err); } } }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (fx.length) stepFx(now);
    if (now - lastDraw < 30) return;
    var dt = Math.min(0.1, (now - last) / 1000); last = now; lastDraw = now; tick++;
    if (!calm.matches) E.t += dt * E.speed;
    if (E.themeDirty || !E.col) readTheme();
    if (!E.col) return;
    if (A.el && A.vis && (calm.matches || !heroO || heroO.shown)) run('avatar', drawAvatar, now, dt); /* waits for the hero's reveal */
    if (S.el && S.vis) run('stage', drawStage, now, dt);
    if (Gl.el && Gl.vis) run('globe', drawGlobe, now, dt);
    if (Td.el && Td.vis && tick % 2 === 0) run('tide', drawTide);
    if (Ph.el && Ph.vis) run('photo', drawPhoto, now, dt);
    run('covers', drawCovers, dt);
    for (var i = 0; i < secs.length; i++) if (secs[i].vis && secs[i].shown) run('ambient', drawAmbient, secs[i], dt);
  }
  function sync() {
    var st = logic.state, p = logic.props;
    var dark = st.dark == null ? (p.mode ?? 'Dark') !== 'Light' : st.dark;
    if (dark !== E.dark) { E.dark = dark; A.stamp = ''; for (var i = 0; i < covers.length; i++) covers[i].__fboC.drawn = false; }
    E.svc = st.svc;
    E.speed = p.motion ?? 1; E.rain = p.rain ?? 1; E.light = p.light ?? 1; E.glyph = Math.round(p.glyph ?? 10);
    E.themeDirty = true;
    bind();
    for (var j = 0; j < secs.length; j++) secs[j].el.style.height = ''; /* the app may have changed a section's content: its real height wins over a pin */
    if (st.cat !== E.cat) { E.cat = st.cat; slotGroup(); decode(logic.skl.current, 520); }
    if (st.modal !== E.modal) { E.modal = st.modal; if (st.modal >= 0 && rootEl) decode(rootEl.querySelector('[data-modal]'), 600); }
  }
  sync();
  if (document.fonts && document.fonts.load) {
    document.fonts.load(monoFont(12)).then(function () { A.stamp = ''; }, function () {});
  }
  raf = requestAnimationFrame(frame);
  return {
    sync: sync,
    stop: function () {
      cancelAnimationFrame(raf); endFx();
      hold(A, null); hold(S, null); hold(Gl, null); hold(Td, null); hold(Ph, null); io.disconnect(); ro.disconnect(); if (pNear) pNear.disconnect();
      if (rootEl) rootEl.removeEventListener('pointerover', onOver);
      for (var i = 0; i < secs.length; i++) { var o = secs[i]; o.el.removeEventListener('pointermove', o.move); o.el.removeEventListener('pointerleave', o.leave); o.el.removeEventListener('focusin', o.focus); o.el.removeAttribute('data-fx'); clearTimeout(o.pin); o.el.style.height = ''; o.el.__fboSec = null; }
      secs.length = 0;
    }
  };
}

export { clamp01, smooth, scrChar, sdf, inView };
