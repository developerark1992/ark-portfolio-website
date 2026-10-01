-- ============================================================================
-- Incremental CRM: visitor accounts + lead activity notifications
-- Run in Supabase SQL Editor if crm.sql already applied.
-- ============================================================================

create table if not exists public.visitor_accounts (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  name          text not null,
  phone         text not null default '',
  lead_id       uuid references public.leads(id) on delete set null,
  session_token text,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists visitor_accounts_email_idx on public.visitor_accounts (lower(email));
create index if not exists visitor_accounts_token_idx on public.visitor_accounts (session_token);

create table if not exists public.lead_events (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid references public.leads(id) on delete cascade,
  event_type text not null,
  title      text not null default '',
  detail     text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists lead_events_created_idx on public.lead_events (created_at desc);
create index if not exists lead_events_lead_idx on public.lead_events (lead_id, created_at desc);

drop trigger if exists visitor_accounts_touch on public.visitor_accounts;
create trigger visitor_accounts_touch before update on public.visitor_accounts
  for each row execute function public.touch_updated_at();

alter table public.visitor_accounts enable row level security;
alter table public.lead_events enable row level security;

drop policy if exists "auth full visitor_accounts" on public.visitor_accounts;
create policy "auth full visitor_accounts" on public.visitor_accounts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth full lead_events" on public.lead_events;
create policy "auth full lead_events" on public.lead_events
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
