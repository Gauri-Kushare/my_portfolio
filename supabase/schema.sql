-- ============================================================================
-- GAURI KUSHARE PORTFOLIO CMS — SUPABASE POSTGRESQL + RLS SCHEMA
-- Authorized Administrator: gaurikushare18@gmail.com
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.portfolio_projects (
  id text primary key default ('proj-' || gen_random_uuid()::text),
  title text not null,
  short_description text not null,
  detailed_description text,
  category text not null check (category in ('reels', 'graphics', 'cinematics', 'websites')),
  status text not null default 'published' check (status in ('published', 'draft')),
  featured boolean not null default false,
  sort_order integer not null default 1,
  cover_image text not null default '',
  video_url text,
  images jsonb not null default '[]'::jsonb,
  screenshots jsonb not null default '[]'::jsonb,
  external_url text,
  industry text,
  technologies jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  aspect_width integer,
  aspect_height integer,
  is_system_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_portfolio_projects_category_status_order
  on public.portfolio_projects (category, status, sort_order asc, created_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- 1. Public visitors can ONLY read published projects (drafts remain private).
-- 2. Only the verified administrator (gaurikushare18@gmail.com) can read drafts,
--    insert, update, or delete projects.
-- ============================================================================

alter table public.portfolio_projects enable row level security;

-- Public read access for published projects only
drop policy if exists "Public can read published portfolio projects" on public.portfolio_projects;
create policy "Public can read published portfolio projects"
  on public.portfolio_projects
  for select
  using (status = 'published');

-- Administrator full read access (including private drafts)
drop policy if exists "Admin gaurikushare18 can read all projects" on public.portfolio_projects;
create policy "Admin gaurikushare18 can read all projects"
  on public.portfolio_projects
  for select
  to authenticated
  using (lower(auth.jwt() ->> 'email') = 'gaurikushare18@gmail.com');

-- Administrator insert access
drop policy if exists "Admin gaurikushare18 can insert projects" on public.portfolio_projects;
create policy "Admin gaurikushare18 can insert projects"
  on public.portfolio_projects
  for insert
  to authenticated
  with check (lower(auth.jwt() ->> 'email') = 'gaurikushare18@gmail.com');

-- Administrator update access
drop policy if exists "Admin gaurikushare18 can update projects" on public.portfolio_projects;
create policy "Admin gaurikushare18 can update projects"
  on public.portfolio_projects
  for update
  to authenticated
  using (lower(auth.jwt() ->> 'email') = 'gaurikushare18@gmail.com')
  with check (lower(auth.jwt() ->> 'email') = 'gaurikushare18@gmail.com');

-- Administrator delete access
drop policy if exists "Admin gaurikushare18 can delete projects" on public.portfolio_projects;
create policy "Admin gaurikushare18 can delete projects"
  on public.portfolio_projects
  for delete
  to authenticated
  using (lower(auth.jwt() ->> 'email') = 'gaurikushare18@gmail.com');

-- ============================================================================
-- STORAGE BUCKET & RLS POLICIES FOR MEDIA UPLOADS
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do nothing;

drop policy if exists "Public can view portfolio media" on storage.objects;
create policy "Public can view portfolio media"
  on storage.objects
  for select
  using (bucket_id = 'portfolio-media');

drop policy if exists "Admin gaurikushare18 can upload portfolio media" on storage.objects;
create policy "Admin gaurikushare18 can upload portfolio media"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-media'
    and lower(auth.jwt() ->> 'email') = 'gaurikushare18@gmail.com'
  );

drop policy if exists "Admin gaurikushare18 can update or delete portfolio media" on storage.objects;
create policy "Admin gaurikushare18 can update or delete portfolio media"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'portfolio-media'
    and lower(auth.jwt() ->> 'email') = 'gaurikushare18@gmail.com'
  );

