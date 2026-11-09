-- ENGIVAULT Database Migration 015: Student Profile Avatar Support
-- Adds avatar_url column to public.profiles and configures student avatar storage.
-- Idempotent — safe to run multiple times.

-- 1. Add avatar_url column to profiles
alter table public.profiles
  add column if not exists avatar_url text;

-- 2. Create the student avatars bucket (public so avatars are accessible via public URL)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'engivault-avatars',
  'engivault-avatars',
  true,          -- Public bucket so the public URL is directly usable in 3D card textures
  5242880,       -- 5 MB limit per upload
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3. Storage policies for the avatars bucket
-- Public SELECT (read) — avatars are public so anyone can view them via public URL
drop policy if exists "Public can view avatars" on storage.objects;
create policy "Public can view avatars"
  on storage.objects for select
  using (bucket_id = 'engivault-avatars');

-- INSERT: Authenticated students can upload their own avatar only to their own folder
drop policy if exists "Students can upload own avatar" on storage.objects;
create policy "Students can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'engivault-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Students can replace their own avatar file
drop policy if exists "Students can update own avatar" on storage.objects;
create policy "Students can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'engivault-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Students can remove their own avatar
drop policy if exists "Students can delete own avatar" on storage.objects;
create policy "Students can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'engivault-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Remove any broad table-level student UPDATE policy on public.profiles
-- Never allow direct row-level UPDATE from authenticated clients because RLS is
-- row-scoped and would otherwise permit self-escalation of role or username.
drop policy if exists "Students can update own avatar_url" on public.profiles;

-- 5. Narrow SECURITY DEFINER RPC so an authenticated student can update ONLY their own avatar_url
create or replace function public.update_own_avatar_url(p_avatar_url text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if p_avatar_url is not null and (
    p_avatar_url !~ '^https://'
    or position('/engivault-avatars/' || v_uid::text || '/' in p_avatar_url) = 0
  ) then
    raise exception 'Invalid avatar URL for current user';
  end if;

  update public.profiles
  set avatar_url = p_avatar_url,
      updated_at = now()
  where id = v_uid;
end;
$$;

revoke all on function public.update_own_avatar_url(text) from public, anon;
grant execute on function public.update_own_avatar_url(text) to authenticated, service_role;

-- 6. Reload PostgREST schema cache
notify pgrst, 'reload schema';
