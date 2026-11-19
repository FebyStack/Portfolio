import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp01, smooth, scrChar, sdf, inView, backing, ambMask, MAX_PX } from './engine.js';

test('inView: at 160px, or a third of a short section or viewport', () => {
  // a 790px section (Work at 1440x900)
  assert.equal(inView(159, 900, 790), false); assert.equal(inView(160, 900, 790), true);
  // tall section (3000 > 812): still 160px, not a share of the section
  assert.equal(inView(159, 812, 3000), false); assert.equal(inView(160, 812, 3000), true);
  // short section (300px): a third of it, 100px
  assert.equal(inView(99, 900, 300), false); assert.equal(inView(100, 900, 300), true);
  // short viewport (landscape phone, 360px): a third of it, so a tall section can still get there
  assert.equal(inView(119, 360, 3000), false); assert.equal(inView(120, 360, 3000), true);
});

test('sdf: finite, inside at the core of solid shapes, outside far away', () => {
  for (let k = 0; k <= 4; k++) {
    for (const t of [0, 1.3, 7]) {
      const far = sdf(k, 3, 3, 3, t);
      assert.ok(Number.isFinite(far) && far > 0, `k=${k} t=${t} far=${far}`);
      // k=4 (two rings) has a hole at the origin; probe on its ring instead
      const d = k === 4 ? sdf(k, 0.2, 0, 0, t) : sdf(k, 0, 0, 0, t);
      assert.ok(Number.isFinite(d) && d < 0, `k=${k} t=${t} core=${d}`);
    }
  }
});

test('scrChar keeps spaces and character class', () => {
  for (const c of [' ', '\n', ' ']) assert.equal(scrChar(c, 0.5), c);
  for (const r of [0, 0.5, 0.999]) {
    assert.match(scrChar('7', r), /^[0-9]$/);
    assert.match(scrChar('Q', r), /^[KXNWMO0]$/);
    assert.match(scrChar('q', r), /^[clodxk]$/);
    assert.match(scrChar('-', r), /^[.',;:]$/);
  }
});

test('clamp01 and smooth stay in [0, 1]', () => {
  assert.equal(clamp01(-2), 0); assert.equal(clamp01(2), 1); assert.equal(clamp01(0.3), 0.3);
  assert.equal(smooth(0, 1, -1), 0); assert.equal(smooth(0, 1, 2), 1); assert.equal(smooth(0, 1, 0.5), 0.5);
});

test('backing: keeps the asked DPR until a canvas would pass MAX_PX, then scales down to fit', () => {
  assert.deepEqual(backing(350, 280, 2), { W: 700, H: 560, d: 2 }); // a phone stage, untouched
  assert.deepEqual(backing(1440, 2506, 1), { W: 1440, H: 2506, d: 1 }); // the tallest desktop rain, untouched
  const b = backing(390, 30000, 3); // a runaway section on a 3x phone
  assert.ok(b.W * b.H <= MAX_PX && b.d < 1, JSON.stringify(b));
  assert.ok(MAX_PX < 16777216 / 2); // well under WebKit's per-canvas limit
});

test('ambMask: the old CSS masks (full in the margins, 30% over text; the hero fades in on its picture side)', () => {
  const [x0, , x1, , st] = ambMask(1440, 900, false, false); // 1440 desktop: margins at 0 and 1440
  assert.deepEqual([x0, x1], [0, 1440]);
  assert.deepEqual(st.map((s) => s[1]), [1, 0.3, 0.3, 1]);
  assert.equal(st[1][0] * 1440, 160); assert.equal(st[2][0] * 1440, 1280);
  assert.deepEqual(ambMask(1000, 800, true, false), [500, 0, 680, 0, [[0, 0.3], [1, 1]]]); // hero, side by side
  assert.deepEqual(ambMask(390, 1000, true, true), [0, 550, 0, 720, [[0, 0.3], [1, 1]]]); // hero, stacked (phone)
});
