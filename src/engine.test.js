import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp01, smooth, sdf, backing, MAX_PX } from './engine.js';

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

test('clamp01 and smooth stay in [0, 1]', () => {
  assert.equal(clamp01(-2), 0); assert.equal(clamp01(2), 1); assert.equal(clamp01(0.3), 0.3);
  assert.equal(smooth(0, 1, -1), 0); assert.equal(smooth(0, 1, 2), 1); assert.equal(smooth(0, 1, 0.5), 0.5);
});

test('backing: keeps the asked DPR until a canvas would pass MAX_PX, then scales down to fit', () => {
  assert.deepEqual(backing(350, 280, 2), { W: 700, H: 560, d: 2 }); // a phone stage, untouched
  assert.deepEqual(backing(1440, 2506, 1), { W: 1440, H: 2506, d: 1 }); // a large canvas within the memory budget
  const b = backing(390, 30000, 3); // a runaway section on a 3x phone
  assert.ok(b.W * b.H <= MAX_PX && b.d < 1, JSON.stringify(b));
  assert.ok(MAX_PX < 16777216 / 2); // well under WebKit's per-canvas limit
});
