import test from 'node:test';
import assert from 'node:assert/strict';
import { FACTS, FALLBACK, localAnswer } from '../supabase/functions/_shared/facts.js';
import { validate, MAX_HISTORY, MAX_TEXT } from '../supabase/functions/_shared/validate.js';

const factFor = (word) => FACTS.find((f) => f.k.includes(word)).a;

test('localAnswer routes questions to the right fact', () => {
  assert.equal(localAnswer('What is Invex?'), factFor('invex'));
  assert.equal(localAnswer('What is your stack?'), factFor('stack'));
  assert.equal(localAnswer('How do you use AI?'), factFor('claude'));
  assert.equal(localAnswer('What is your name?'), factFor('who are'));
  assert.equal(localAnswer('How do you pronounce your name?'), factFor('pronounc'));
  assert.equal(localAnswer('Where do you study?'), factFor('jrmsu'));
  assert.equal(localAnswer('Are you available for part-time work?'), factFor('part-time'));
  assert.equal(localAnswer('Can I call you?'), factFor('contact'));
  assert.equal(localAnswer('How much do you charge?'), factFor('contact'));
  assert.equal(localAnswer('What do you do at The Sev Clinic?'), factFor('manpower'));
  assert.equal(localAnswer('Do you record content for the clinic?'), factFor('record'));
  assert.equal(localAnswer('What is Invex built with?'), factFor('invex built'));
  assert.equal(localAnswer('Is PilaPass live?'), factFor('in use'));
  assert.equal(localAnswer('What is INKWILD?'), factFor('animation'));
  assert.equal(localAnswer('Where can I watch INKWILD?'), factFor('tiktok'));
  assert.equal(localAnswer('How do you work with clients?'), factFor('work with'));
  assert.equal(localAnswer('What happens after launch?'), factFor('after launch'));
  assert.equal(localAnswer('qzx vbn'), FALLBACK);
});

test('validate accepts what main.js sends and rejects out-of-bounds payloads', () => {
  // built like ask() in main.js
  const msgs = [{ role: 'bot', text: 'Hi.' }, { role: 'you', text: 'a' }, { role: 'bot', text: 'x'.repeat(900) }, { role: 'you', text: 'b' }, { role: 'bot', text: '' }];
  const history = msgs.slice(-MAX_HISTORY).filter((m) => m.text).map((m) => ({ role: m.role, text: m.text.slice(0, MAX_TEXT) }));
  assert.ok(validate({ q: 'What is Invex?', history }));
  const ok = { role: 'you', text: 'hi' };
  assert.equal(validate({ q: 'hi', history: Array(5).fill(ok) }), null);
  assert.equal(validate({ q: 'hi', history: [{ role: 'bot', text: 'x'.repeat(601) }] }), null);
  assert.equal(validate({ q: 'hi', history: [{ role: '__proto__', text: 'hi' }] }), null);
  assert.equal(validate({ q: '' }), null);
  assert.equal(validate({ q: 'x'.repeat(241) }), null);
});
