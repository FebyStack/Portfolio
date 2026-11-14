// POST { q, history?, sid?, ref? } -> { text, id }: Grok (xAI) proxy for the portfolio avatar. The key never leaves this function.
// POST { id, rating } -> { ok: true }: a visitor's thumbs up (1) / down (-1) on that answer.
// Every ask that reaches xAI writes one public.chat_logs row (supabase/migrations/*_chat_logs.sql), never blocking the reply.
// CORS fails closed: a request carrying an Origin not listed in ALLOWED_ORIGIN (comma-separated; unset = none)
// gets 403. Requests without Origin (curl, servers) pass, subject to the limits. Local dev: ALLOWED_ORIGIN=http://localhost:5173.
import { FACTS, PROMPT } from '../_shared/facts.js';
import { ROLES, validate, validateRating } from '../_shared/validate.js';

// Verified 2026-11-13 against https://docs.x.ai/docs/models and https://docs.x.ai/docs/api-reference
// (Responses API is the recommended endpoint; Chat Completions is marked deprecated).
// grok-4.20-0309-non-reasoning: non-reasoning, positioned for speed, cheapest tier of the general chat models.
const MODEL = Deno.env.get('XAI_MODEL') || 'grok-4.20-0309-non-reasoning';
const XAI_URL = 'https://api.x.ai/v1/responses';
const ORIGINS = (Deno.env.get('ALLOWED_ORIGIN') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const SYSTEM = PROMPT + FACTS.map((f: { a: string }) => '- ' + f.a).join('\n');
const MAX_BODY = 8192;

// Logging goes straight to PostgREST with the service key (bypasses RLS; the table has no policies).
// Injected env vars: SUPABASE_URL, SUPABASE_SECRET_KEYS (JSON dictionary, new keys) and the legacy SUPABASE_SERVICE_ROLE_KEY
// (https://supabase.com/docs/guides/functions/secrets). New secret keys go on `apikey` only, never as a Bearer token; the
// legacy key is a JWT (`eyJ...`) and also goes on Authorization (https://supabase.com/docs/guides/api/api-keys).
async function db(method: 'POST' | 'PATCH', query: string, row: Record<string, unknown>) {
  try { // key lookup inside the try too: nothing here may break the chat
    const key: string = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const headers: Record<string, string> = { apikey: key, 'content-type': 'application/json' };
    if (key.startsWith('eyJ')) headers.authorization = `Bearer ${key}`;
    const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/chat_logs${query}`, {
      method, headers, body: JSON.stringify(row), signal: AbortSignal.timeout(5000)
    });
    if (!r.ok) console.error('ask: log status', r.status);
  } catch (err) {
    console.error('ask: log failed', (err as Error).name);
  }
}
// Runs the write after the response is sent (https://supabase.com/docs/guides/functions/background-tasks).
// Outside Supabase's runtime (plain `deno run`) EdgeRuntime is absent and the promise just runs unawaited.
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };
const later = (p: Promise<void>) => { if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(p); };
// xAI Responses `usage.input_tokens` / `usage.output_tokens` are integers
// (https://docs.x.ai/developers/rest-api-reference/inference/responses); anything else is stored as null.
const int = (n: unknown) => (Number.isInteger(n) ? n : null);

// ponytail: in-memory limiter: per IP 10 requests/minute, plus a global cap of 300 requests/hour per
// isolate (bounds xAI spend even if the IP key is spoofed or rotated). Ceiling: per isolate, resets on
// cold start, so traffic spread across isolates gets more. Upgrade: a Postgres table + RPC
// (ip, window_start, count) called with the service role before hitting xAI.
const LIMIT = 10, WINDOW_MS = 60_000, MAX_IPS = 5000;
const GLOBAL_LIMIT = 300, GLOBAL_MS = 3_600_000;
const hits = new Map<string, { n: number; reset: number }>();
let all = { n: 0, reset: 0 };
function limited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (h && now <= h.reset) { if (++h.n > LIMIT) return true; }
  else {
    if (hits.size >= MAX_IPS) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    if (hits.size >= MAX_IPS) return true; // flood of distinct IPs: refuse newcomers, keep everyone's counters
    hits.set(ip, { n: 1, reset: now + WINDOW_MS });
  }
  if (now > all.reset) all = { n: 0, reset: now + GLOBAL_MS };
  return ++all.n > GLOBAL_LIMIT;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const allowed = origin && ORIGINS.includes(origin) ? origin : null;
  const headers: Record<string, string> = { 'content-type': 'application/json', vary: 'Origin' };
  if (allowed) {
    headers['access-control-allow-origin'] = allowed;
    headers['access-control-allow-methods'] = 'POST, OPTIONS';
    headers['access-control-allow-headers'] = 'content-type';
    headers['access-control-max-age'] = '86400';
  }
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });

  if (origin && !allowed) return reply(403, { error: 'Origin not allowed' });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return reply(415, { error: 'Send JSON' });
  const len = req.headers.get('content-length');
  if (len === null) return reply(411, { error: 'Length required' });
  if (Number(len) > MAX_BODY) return reply(413, { error: 'Too large' });

  // Not settled by the docs: Supabase's own example keys on the first x-forwarded-for entry
  // (https://supabase.com/docs/guides/functions/examples/cloudflare-turnstile), and only the self-hosted
  // Envoy gateway documents ignoring a client-sent value (https://supabase.com/docs/guides/self-hosting/self-hosted-envoy).
  // Whether the hosted gateway overwrites or appends is undocumented, so this key may be spoofable; the global cap bounds it.
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return reply(429, { error: 'Too many questions. Try again in a minute.' });

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return reply(413, { error: 'Too large' });
    body = JSON.parse(raw);
  } catch {
    return reply(400, { error: 'Bad request' });
  }
  const input = validate(body);
  if (!input) {
    const vote = validateRating(body);
    if (!vote) return reply(400, { error: 'Bad request' });
    // ponytail: no auth on ratings. The row's random uuid, returned only to the visitor who asked, is the capability.
    // rating=is.null keeps it one vote per answer; the reply is the same whether a row matched or not, so ids can't be probed.
    later(db('PATCH', `?id=eq.${vote.id}&rating=is.null`, { rating: vote.rating, rated_at: new Date().toISOString() }));
    return reply(200, { ok: true });
  }

  const key = Deno.env.get('XAI_API_KEY');
  if (!key) { console.error('ask: XAI_API_KEY is not set'); return reply(500, { error: 'Not configured' }); }

  const id = crypto.randomUUID(), t0 = Date.now();
  const log = (answer: string | null, error_code: number | null, usage?: { input_tokens?: unknown; output_tokens?: unknown }) =>
    later(db('POST', '', {
      id, session_id: input.sid ?? null, question: input.q, answer, status: answer ? 'ok' : 'error', error_code, model: MODEL,
      latency_ms: Date.now() - t0, input_tokens: int(usage?.input_tokens), output_tokens: int(usage?.output_tokens),
      history_turns: input.history.length, referrer: input.ref ?? null
    }));

  try {
    const r = await fetch(XAI_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        instructions: SYSTEM,
        input: [...input.history.map((m) => ({ role: ROLES[m.role], content: m.text })), { role: 'user', content: input.q }],
        max_output_tokens: 160,
        temperature: 0.3,
        store: false
      }),
      signal: AbortSignal.timeout(7000) // under the client's 8s, so the client gets our 502 rather than its own abort
    });
    if (!r.ok) { console.error('ask: upstream status', r.status); log(null, r.status); return reply(502, { error: 'Upstream error' }); }
    const data = await r.json();
    const text = (data.output ?? [])
      .flatMap((o: { type?: string; content?: unknown[] }) => (o.type === 'message' && Array.isArray(o.content) ? o.content : []))
      .filter((c: { type?: string; text?: unknown }) => c.type === 'output_text' && typeof c.text === 'string')
      .map((c: { text: string }) => c.text)
      .join('')
      .trim();
    log(text || null, null, data.usage);
    if (!text) return reply(502, { error: 'Upstream error' });
    return reply(200, { text, id });
  } catch (err) {
    console.error('ask: upstream failed', (err as Error).name);
    log(null, null);
    return reply(502, { error: 'Upstream error' });
  }
});
