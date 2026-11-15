import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp01, smooth, scrChar, sdf, inView } from './engine.js';

test('inView: in above a third, out below a quarter, of the shorter of viewport and section', () => {
  // short section (600 < 900): its own height counts
  assert.equal(inView(false, 199, 900, 600), false); assert.equal(inView(false, 201, 900, 600), true);
  assert.equal(inView(true, 151, 900, 600), true); assert.equal(inView(true, 149, 900, 600), false);
  // tall section (3000 > 812): the viewport counts, not the section's ratio
  assert.equal(inView(false, 270, 812, 3000), false); assert.equal(inView(false, 272, 812, 3000), true);
  assert.equal(inView(true, 204, 812, 3000), true); assert.equal(inView(true, 202, 812, 3000), false);
  // between the two lines the state holds, so the edge can't flicker
  for (const v of [205, 240, 270]) { assert.equal(inView(true, v, 812, 3000), true); assert.equal(inView(false, v, 812, 3000), false); }
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
