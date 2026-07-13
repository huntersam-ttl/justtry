create schema if not exists private;

create or replace function private.is_admin()
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
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists "Public can read published content" on public.content_items;
create policy "Public can read published content" on public.content_items
for select using (status = 'published' or private.is_admin());

drop policy if exists "Admins manage content" on public.content_items;
create policy "Admins manage content" on public.content_items
for all using (private.is_admin()) with check (private.is_admin());

drop policy if exists "Public can read visible events" on public.events;
create policy "Public can read visible events" on public.events
for select using (status in ('published', 'planned') or private.is_admin());

drop policy if exists "Admins manage events" on public.events;
create policy "Admins manage events" on public.events
for all using (private.is_admin()) with check (private.is_admin());

drop policy if exists "Admins manage series" on public.series;
create policy "Admins manage series" on public.series
for all using (private.is_admin()) with check (private.is_admin());

drop policy if exists "Anyone can submit team applications" on public.team_applications;
create policy "Anyone can submit team applications" on public.team_applications
for insert with check (name is not null and email is not null and status = 'new');

drop policy if exists "Admins read team applications" on public.team_applications;
create policy "Admins read team applications" on public.team_applications
for select using (private.is_admin());

drop policy if exists "Admins update team applications" on public.team_applications;
create policy "Admins update team applications" on public.team_applications
for update using (private.is_admin()) with check (private.is_admin());

drop policy if exists "Anyone can submit collaboration requests" on public.collaboration_requests;
create policy "Anyone can submit collaboration requests" on public.collaboration_requests
for insert with check (name is not null and email is not null and status = 'new');

drop policy if exists "Admins read collaboration requests" on public.collaboration_requests;
create policy "Admins read collaboration requests" on public.collaboration_requests
for select using (private.is_admin());

drop policy if exists "Admins update collaboration requests" on public.collaboration_requests;
create policy "Admins update collaboration requests" on public.collaboration_requests
for update using (private.is_admin()) with check (private.is_admin());

drop policy if exists "Admins can read admin profiles" on public.admin_profiles;
create policy "Admins can read admin profiles" on public.admin_profiles
for select using (private.is_admin() or user_id = auth.uid());

drop policy if exists "Public can read media" on storage.objects;

drop policy if exists "Admins can upload media" on storage.objects;
create policy "Admins can upload media" on storage.objects
for insert with check (bucket_id = 'media' and private.is_admin());

drop policy if exists "Admins can update media" on storage.objects;
create policy "Admins can update media" on storage.objects
for update using (bucket_id = 'media' and private.is_admin()) with check (bucket_id = 'media' and private.is_admin());

drop policy if exists "Admins can delete media" on storage.objects;
create policy "Admins can delete media" on storage.objects
for delete using (bucket_id = 'media' and private.is_admin());

drop function if exists public.is_admin();
