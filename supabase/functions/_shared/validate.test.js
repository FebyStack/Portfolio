import test from 'node:test';
import assert from 'node:assert/strict';
import { validate, validateRating } from './validate.js';

const sid = crypto.randomUUID(), id = crypto.randomUUID();

test('ask: sid and ref are optional and checked', () => {
  // shaped like ask() in main.js
  assert.deepEqual(validate({ q: ' hi ', history: [{ role: 'bot', text: 'Hi.' }], sid, ref: 'www.linkedin.com' }),
    { q: 'hi', history: [{ role: 'bot', text: 'Hi.' }], sid, ref: 'www.linkedin.com' });
  assert.ok(validate({ q: 'hi' }));
  assert.equal(validate({ q: 'hi', sid: 'not-a-uuid' }), null);
  assert.equal(validate({ q: 'hi', sid: sid.toUpperCase() }), null);
  assert.equal(validate({ q: 'hi', ref: 'http://x.com/path' }), null);
  assert.equal(validate({ q: 'hi', ref: 'a'.repeat(101) }), null);
  assert.ok(validate({ q: 'hi', ref: 'a'.repeat(100) }));
  assert.equal(validate({ q: 'hi', id, rating: 1 }), null);
});

test('rating: exactly { id: uuid, rating: 1 | -1 }', () => {
  assert.deepEqual(validateRating({ id, rating: 1 }), { id, rating: 1 });
  assert.deepEqual(validateRating({ id, rating: -1 }), { id, rating: -1 });
  for (const rating of [0, 2, '1', null]) assert.equal(validateRating({ id, rating }), null);
  assert.equal(validateRating({ rating: 1 }), null);
  assert.equal(validateRating({ id: 'x', rating: 1 }), null);
  assert.equal(validateRating({ id, rating: 1, q: 'hi' }), null);
  assert.equal(validateRating([id, 1]), null);
  assert.equal(validateRating(null), null);
});
