-- ============================================================================
-- ARK portfolio — blog schema for Supabase
-- Run this FIRST in Supabase → SQL Editor, then run supabase/seed.sql.
-- ============================================================================

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  description      text not null default '',
  body             text not null default '',        -- markdown
  cover            text,                              -- image URL / path
  category_id      uuid references public.categories(id) on delete set null,
  -- SEO
  meta_title       text,
  meta_description text,
  keywords         text,
  published        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists posts_published_created_idx on public.posts (published, created_at desc);

create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- Row Level Security ---------------------------------------------------------
alter table public.posts      enable row level security;
alter table public.categories enable row level security;

drop policy if exists "public reads published posts" on public.posts;
create policy "public reads published posts" on public.posts
  for select using (published = true);
drop policy if exists "public reads categories" on public.categories;
create policy "public reads categories" on public.categories
  for select using (true);

drop policy if exists "auth full posts" on public.posts;
create policy "auth full posts" on public.posts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth full categories" on public.categories;
create policy "auth full categories" on public.categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Safe to re-run if columns were added later:
alter table public.posts add column if not exists meta_title text;
alter table public.posts add column if not exists meta_description text;
alter table public.posts add column if not exists keywords text;
