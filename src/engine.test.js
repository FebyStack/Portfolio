import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp01, smooth, scrChar, sdf, inView } from './engine.js';

test('inView: in at 160px (or a third of a short section or viewport), out under 60% of that', () => {
  // Work at 1440x900 (785px tall): the 180px that peek into the first screen reveal it
  assert.equal(inView(false, 180, 900, 785), true);
  assert.equal(inView(false, 159, 900, 785), false); assert.equal(inView(false, 160, 900, 785), true);
  assert.equal(inView(true, 96, 900, 785), true); assert.equal(inView(true, 95, 900, 785), false);
  // tall section (3000 > 812): still 160px, not a share of the section
  assert.equal(inView(false, 159, 812, 3000), false); assert.equal(inView(false, 160, 812, 3000), true);
  // short section (300px): a third of it, 100px; out under 60px
  assert.equal(inView(false, 99, 900, 300), false); assert.equal(inView(false, 100, 900, 300), true);
  assert.equal(inView(true, 60, 900, 300), true); assert.equal(inView(true, 59, 900, 300), false);
  // short viewport (landscape phone, 360px): a third of it, so a tall section can still get there
  assert.equal(inView(false, 119, 360, 3000), false); assert.equal(inView(false, 120, 360, 3000), true);
  // between the two lines the state holds, so the edge can't flicker
  for (const v of [96, 120, 159]) { assert.equal(inView(true, v, 900, 785), true); assert.equal(inView(false, v, 900, 785), false); }
});

test('sdf: finite, inside at the core of solid shapes, outside far away', () => {
  for (let k = 0; k <= 5; k++) {
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
