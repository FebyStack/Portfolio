// Request shapes for the `ask` function. Plain JS so Deno (ask/index.ts) and Node (main.js, tests) share it.
/** @type {Record<string, string>} */
export const ROLES = { you: 'user', bot: 'assistant' };
export const MAX_HISTORY = 4, MAX_TEXT = 600;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const HOST = /^[a-z0-9.-]{1,100}$/; // bare referrer hostname; main.js filters with it so a visitor's odd referrer can't 400 the chat
const ASK_KEYS = ['q', 'history', 'sid', 'ref'];

/** Ask: { q, history?, sid?, ref? }. Unknown keys are refused, so a rating mixed into an ask is a 400.
 * @returns {{ q: string, history: { role: string, text: string }[], sid?: string, ref?: string } | null} */
export function validate(body) {
  if (!body || typeof body !== 'object' || Object.keys(body).some((k) => !ASK_KEYS.includes(k))) return null;
  const { q, history = [], sid, ref } = body;
  if (typeof q !== 'string') return null;
  const clean = q.replace(/\s+/g, ' ').trim();
  if (clean.length < 1 || clean.length > 240) return null;
  if (!Array.isArray(history) || history.length > MAX_HISTORY) return null;
  for (const m of history) {
    if (!m || typeof m !== 'object' || typeof m.role !== 'string' || !Object.hasOwn(ROLES, m.role)) return null;
    if (typeof m.text !== 'string' || m.text.length > MAX_TEXT) return null;
  }
  if (sid !== undefined && !(typeof sid === 'string' && UUID.test(sid))) return null;
  if (ref !== undefined && !(typeof ref === 'string' && HOST.test(ref))) return null;
  return { q: clean, history: history.map((m) => ({ role: m.role, text: m.text })), sid, ref };
}

/** Rate: exactly { id: uuid, rating: 1 | -1 }.
 * @returns {{ id: string, rating: 1 | -1 } | null} */
export function validateRating(body) {
  if (!body || typeof body !== 'object' || Object.keys(body).length !== 2) return null;
  const { id, rating } = body;
  return typeof id === 'string' && UUID.test(id) && (rating === 1 || rating === -1) ? { id, rating } : null;
}
