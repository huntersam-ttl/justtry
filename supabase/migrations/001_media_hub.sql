create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  type text not null check (type in ('documentary', 'show', 'event', 'blog', 'feature', 'short')),
  category text,
  excerpt text,
  body text,
  thumbnail_image text,
  video_url text,
  external_link text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  published_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  poster_image text,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  date text,
  location text,
  description text,
  poster_image text,
  ticket_link text,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text,
  location text,
  portfolio_url text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.collaboration_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  project_type text,
  budget_range text,
  timeline text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid()
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_items_updated_at on public.content_items;
create trigger content_items_updated_at before update on public.content_items
for each row execute function public.set_updated_at();

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists series_updated_at on public.series;
create trigger series_updated_at before update on public.series
for each row execute function public.set_updated_at();

alter table public.admin_profiles enable row level security;
alter table public.content_items enable row level security;
alter table public.series enable row level security;
alter table public.events enable row level security;
alter table public.team_applications enable row level security;
alter table public.collaboration_requests enable row level security;

drop policy if exists "Public can read published content" on public.content_items;
create policy "Public can read published content" on public.content_items
for select using (status = 'published' or public.is_admin());

drop policy if exists "Admins manage content" on public.content_items;
create policy "Admins manage content" on public.content_items
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read visible events" on public.events;
create policy "Public can read visible events" on public.events
for select using (status in ('published', 'planned') or public.is_admin());

drop policy if exists "Admins manage events" on public.events;
create policy "Admins manage events" on public.events
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read series" on public.series;
create policy "Public can read series" on public.series
for select using (true);

drop policy if exists "Admins manage series" on public.series;
create policy "Admins manage series" on public.series
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Anyone can submit team applications" on public.team_applications;
create policy "Anyone can submit team applications" on public.team_applications
for insert with check (true);

drop policy if exists "Admins read team applications" on public.team_applications;
create policy "Admins read team applications" on public.team_applications
for select using (public.is_admin());

drop policy if exists "Admins update team applications" on public.team_applications;
create policy "Admins update team applications" on public.team_applications
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Anyone can submit collaboration requests" on public.collaboration_requests;
create policy "Anyone can submit collaboration requests" on public.collaboration_requests
for insert with check (true);

drop policy if exists "Admins read collaboration requests" on public.collaboration_requests;
create policy "Admins read collaboration requests" on public.collaboration_requests
for select using (public.is_admin());

drop policy if exists "Admins update collaboration requests" on public.collaboration_requests;
create policy "Admins update collaboration requests" on public.collaboration_requests
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can read admin profiles" on public.admin_profiles;
create policy "Admins can read admin profiles" on public.admin_profiles
for select using (public.is_admin() or user_id = auth.uid());

insert into public.series (title, slug, description, status)
values
  ('Built From Zero', 'built-from-zero', 'Founder and creator journeys from the earliest stage.', 'planned'),
  ('Artist Diaries', 'artist-diaries', 'Creative process, identity, discipline, and performance.', 'planned'),
  ('Student Stories', 'student-stories', 'Youth culture and real stories from student life.', 'planned'),
  ('Just Try Challenges', 'just-try-challenges', 'Human challenges with energy, humour, and stakes.', 'planned'),
  ('Marketplace Stories', 'marketplace-stories', 'The people, makers, and trades behind local commerce.', 'planned'),
  ('Behind The Business', 'behind-the-business', 'Small teams, experiments, and the work nobody sees.', 'planned')
on conflict (slug) do nothing;

insert into public.content_items (title, slug, type, category, excerpt, status, featured, published_date)
values
  ('Built From Zero', 'built-from-zero-preview', 'documentary', 'Founder Stories', 'A raw series following people building their first serious thing with limited money, time, and proof.', 'published', true, now()),
  ('Artist Diaries', 'artist-diaries-preview', 'show', 'Creator Stories', 'Short cinematic portraits of artists, performers, and makers documenting the messy middle.', 'published', true, now()),
  ('Student Stories', 'student-stories-preview', 'feature', 'Culture', 'Campus life, side hustles, pressure, and the young people trying anyway.', 'published', true, now())
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read media" on storage.objects;
create policy "Public can read media" on storage.objects
for select using (bucket_id = 'media');

drop policy if exists "Admins can upload media" on storage.objects;
create policy "Admins can upload media" on storage.objects
for insert with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins can update media" on storage.objects;
create policy "Admins can update media" on storage.objects
for update using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins can delete media" on storage.objects;
create policy "Admins can delete media" on storage.objects
for delete using (bucket_id = 'media' and public.is_admin());
