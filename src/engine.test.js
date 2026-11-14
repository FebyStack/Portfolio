import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp01, smooth, scrChar, sdf } from './engine.js';

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
