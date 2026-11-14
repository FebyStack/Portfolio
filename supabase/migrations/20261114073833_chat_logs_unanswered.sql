-- "Unanswered" as a stored flag, set by the `ask` edge function: true when the model ends its reply with the [nf] token
-- (PROMPT in supabase/functions/_shared/facts.js), which it uses in every language, so Bisaya/Tagalog refusals count too.
-- Null on error rows and on rows logged before this column existed. Safe to re-run.
alter table public.chat_logs add column if not exists unanswered boolean;

-- ponytail: the answer-contains-'on file' match is now only a fallback for old rows (unanswered is null). Ceiling: the
-- flag is the model's own judgement and it can forget or misplace the token. Upgrade: structured output with an
-- "answered" field. chat_top_questions has no unanswered column, so 20261114022500_chat_logs.sql's version stands.
-- Columns, order and types match 20261114022500_chat_logs.sql (create or replace view can't change them).
create or replace view public.chat_daily with (security_invoker = true) as
select
  (created_at at time zone 'Asia/Manila')::date as day,
  count(*) as chats,
  count(distinct session_id) as conversations,
  count(*) filter (where status = 'error') as errors,
  count(*) filter (where coalesce(unanswered, answer ilike '%on file%', false)) as unanswered,
  count(*) filter (where rating = 1) as thumbs_up,
  count(*) filter (where rating = -1) as thumbs_down,
  round(avg(latency_ms)) as avg_latency_ms,
  sum(coalesce(input_tokens, 0) + coalesce(output_tokens, 0)) as total_tokens
from public.chat_logs
group by 1
order by 1 desc;

create or replace view public.chat_review with (security_invoker = true) as
select
  created_at,
  question,
  answer,
  rating,
  coalesce(unanswered, answer ilike '%on file%', false) as unanswered,
  status
from public.chat_logs
where status = 'error' or rating = -1 or coalesce(unanswered, answer ilike '%on file%', false)
order by created_at desc;

revoke all on public.chat_daily, public.chat_review from anon, authenticated;
