-- ============================================================================
-- ARK portfolio — blog schema for Supabase
-- Run this once in Supabase → SQL Editor → New query → Run.
-- ============================================================================

-- Categories -----------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

-- Posts ----------------------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text not null default '',
  body        text not null default '',            -- markdown
  cover       text,                                 -- optional image URL
  category_id uuid references public.categories(id) on delete set null,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists posts_published_created_idx on public.posts (published, created_at desc);

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- Row Level Security ---------------------------------------------------------
alter table public.posts      enable row level security;
alter table public.categories enable row level security;

-- Public can read PUBLISHED posts + all categories
drop policy if exists "public reads published posts" on public.posts;
create policy "public reads published posts" on public.posts
  for select using (published = true);
drop policy if exists "public reads categories" on public.categories;
create policy "public reads categories" on public.categories
  for select using (true);

-- Any authenticated user (your admin login) can do everything
drop policy if exists "auth full posts" on public.posts;
create policy "auth full posts" on public.posts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth full categories" on public.categories;
create policy "auth full categories" on public.categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed categories + the 3 starter posts -------------------------------------
insert into public.categories (name, slug) values
  ('CMS','cms'), ('Automation','automation'), ('Hosting & DevOps','hosting-devops'), ('General','general')
on conflict (slug) do nothing;

insert into public.posts (slug, title, description, category_id, published, created_at, body) values
(
  'wordpress-vs-shopify',
  'WordPress vs Shopify: which should you actually build on?',
  'A no-nonsense guide to picking the right platform for your business — from someone who builds on both every week.',
  (select id from public.categories where slug='cms'), true, '2026-07-18',
  E'One of the first questions I get from clients is: *"Should we use WordPress or Shopify?"* The honest answer is — it depends on what you''re selling and how you want to run it.\n\n## Go with WordPress (WooCommerce) if…\n\n- You want **full control** over design, content and structure.\n- Content and SEO matter as much as sales.\n- Budget matters: WordPress is typically the **most affordable** build.\n\n## Go with Shopify if…\n\n- E-commerce is the **whole point** — orders, inventory, checkout.\n- You want payments, shipping and tax handled out of the box.\n\n## My rule of thumb\n\nIf the store *is* the business, Shopify saves you time. If the website is a marketing engine that also sells, WordPress gives you room to grow. Either way, I set up hosting, SEO and analytics so it launches ready to perform.'
),
(
  'automate-client-sites-with-ai',
  '5 ways I automate client websites with AI',
  'How I use Claude, ChatGPT, n8n and Zapier to remove hours of manual work from every project.',
  (select id from public.categories where slug='automation'), true, '2026-07-20',
  E'Automation isn''t a buzzword on my projects — it''s how I keep small teams from drowning in busywork.\n\n## 1. Lead routing on autopilot\nForm submissions get parsed, tagged and pushed into a CRM or Slack — with an instant branded auto-reply.\n\n## 2. AI-assisted content drafts\nI connect **Claude / ChatGPT** so descriptions, outlines and FAQs start as solid drafts.\n\n## 3. Ops & reporting digests\n**n8n** and **Zapier** collect the week''s analytics, orders and uptime into one clean email.\n\n## 4. Support triage\nIncoming messages get classified and answered (or escalated) automatically.\n\n## 5. Sync the tools you already use\nSheets ↔ CRM ↔ email ↔ site — the glue that stops copy-pasting by hand.'
),
(
  'why-hosting-matters',
  'Your beautiful site is only as good as its hosting',
  'Why hosting, DNS, SSL and backups quietly decide whether your website is fast, secure and actually online.',
  (select id from public.categories where slug='hosting-devops'), true, '2026-07-14',
  E'A gorgeous design means nothing if the site is slow or keeps going down. The unglamorous layer — hosting and DevOps — keeps everything standing.\n\n## What "good hosting" actually covers\n\n- **The right environment** — WHM/cPanel or cloud (AWS, Cloudflare).\n- **DNS & SSL** set up correctly.\n- **Backups** you can actually restore from.\n- **Monitoring** so problems get caught early.\n- **Migrations** done without downtime.\n\n## Why hand it to one person\n\nWhen the same person builds *and* hosts your site, there''s no finger-pointing when something breaks. I own it end to end.'
)
on conflict (slug) do nothing;
