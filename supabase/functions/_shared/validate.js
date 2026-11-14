// Request shape for the `ask` function. Plain JS so Deno (ask/index.ts) and Node (main.js, tests) share it.
/** @type {Record<string, string>} */
export const ROLES = { you: 'user', bot: 'assistant' };
export const MAX_HISTORY = 4, MAX_TEXT = 600;

/** @returns {{ q: string, history: { role: string, text: string }[] } | null} */
export function validate(body) {
  if (!body || typeof body !== 'object') return null;
  const { q, history = [] } = body;
  if (typeof q !== 'string') return null;
  const clean = q.replace(/\s+/g, ' ').trim();
  if (clean.length < 1 || clean.length > 240) return null;
  if (!Array.isArray(history) || history.length > MAX_HISTORY) return null;
  for (const m of history) {
    if (!m || typeof m !== 'object' || typeof m.role !== 'string' || !Object.hasOwn(ROLES, m.role)) return null;
    if (typeof m.text !== 'string' || m.text.length > MAX_TEXT) return null;
  }
  return { q: clean, history: history.map((m) => ({ role: m.role, text: m.text })) };
}
