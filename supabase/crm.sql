-- ============================================================================
-- ARK CRM — leads, chat transcripts, page visits, outreach logs
-- Run in Supabase → SQL Editor AFTER schema.sql (blog tables).
-- Needs SUPABASE_SERVICE_ROLE_KEY on Vercel for API writes.
-- ============================================================================

create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  phone        text not null default '',
  page         text,
  session_id   text,
  source       text not null default 'chat',
  status       text not null default 'new',
  notes        text not null default '',
  last_message text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_email_idx on public.leads (lower(email));
create index if not exists leads_status_idx on public.leads (status);

create table if not exists public.chat_sessions (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid references public.leads(id) on delete set null,
  session_id   text not null unique,
  page         text,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  message_count int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists chat_sessions_updated_idx on public.chat_sessions (updated_at desc);
create index if not exists chat_sessions_lead_idx on public.chat_sessions (lead_id);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id text not null references public.chat_sessions(session_id) on delete cascade,
  role       text not null check (role in ('user', 'bot')),
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_idx on public.chat_messages (session_id, created_at);

create table if not exists public.page_views (
  id          uuid primary key default gen_random_uuid(),
  visitor_id  text not null,
  session_id  text,
  path        text not null,
  referrer    text,
  title       text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists page_views_created_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx on public.page_views (path);
create index if not exists page_views_visitor_idx on public.page_views (visitor_id, created_at desc);

create table if not exists public.email_logs (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid references public.leads(id) on delete set null,
  to_email   text not null,
  subject    text not null,
  body       text not null,
  kind       text not null default 'reply',
  status     text not null default 'sent',
  created_at timestamptz not null default now()
);

create index if not exists email_logs_created_idx on public.email_logs (created_at desc);

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

drop trigger if exists chat_sessions_touch on public.chat_sessions;
create trigger chat_sessions_touch before update on public.chat_sessions
  for each row execute function public.touch_updated_at();

-- RLS: public cannot read; authenticated admin can; service role bypasses RLS
alter table public.leads enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.page_views enable row level security;
alter table public.email_logs enable row level security;

drop policy if exists "auth full leads" on public.leads;
create policy "auth full leads" on public.leads
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth full chat_sessions" on public.chat_sessions;
create policy "auth full chat_sessions" on public.chat_sessions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth full chat_messages" on public.chat_messages;
create policy "auth full chat_messages" on public.chat_messages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth full page_views" on public.page_views;
create policy "auth full page_views" on public.page_views
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth full email_logs" on public.email_logs;
create policy "auth full email_logs" on public.email_logs
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
