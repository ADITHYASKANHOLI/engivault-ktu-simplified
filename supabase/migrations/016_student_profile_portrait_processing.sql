-- ENGIVAULT Database Migration 016: Student Portrait Processing & Multi-Asset Storage
-- Extends public.profiles to track original, isolated monochrome portrait,
-- and composed ID card front URLs independently so processed portraits are
-- cached and reused without unnecessary reprocessing.
-- Idempotent — safe to run multiple times.

-- 1. Add separate avatar asset and processing status columns to public.profiles
alter table public.profiles
  add column if not exists avatar_original_url text,
  add column if not exists avatar_processed_url text,
  add column if not exists avatar_card_url text,
  add column if not exists avatar_processing_status text not null default 'none',
  add column if not exists avatar_updated_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_avatar_processing_status_check;

alter table public.profiles
  add constraint profiles_avatar_processing_status_check
  check (avatar_processing_status in ('none', 'processed', 'fallback', 'legacy'));

-- 2. Narrow SECURITY DEFINER RPC so an authenticated student can persist ONLY
--    their own verified avatar asset URLs under /engivault-avatars/<uid>/.
create or replace function public.update_own_avatar_assets(
  p_avatar_url text,
  p_avatar_original_url text,
  p_avatar_processed_url text,
  p_avatar_card_url text,
  p_processing_status text default 'none'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_url text;
  v_urls text[];
  v_status text := coalesce(nullif(trim(p_processing_status), ''), 'none');
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if v_status not in ('none', 'processed', 'fallback', 'legacy') then
    raise exception 'Invalid avatar processing status';
  end if;

  v_urls := array[
    p_avatar_url,
    p_avatar_original_url,
    p_avatar_processed_url,
    p_avatar_card_url
  ];

  foreach v_url in array v_urls loop
    if v_url is not null and (
      v_url !~ '^https://'
      or position('/engivault-avatars/' || v_uid::text || '/' in v_url) = 0
    ) then
      raise exception 'Invalid avatar asset URL for current user';
    end if;
  end loop;

  update public.profiles
  set avatar_url = p_avatar_url,
      avatar_original_url = p_avatar_original_url,
      avatar_processed_url = p_avatar_processed_url,
      avatar_card_url = p_avatar_card_url,
      avatar_processing_status = v_status,
      avatar_updated_at = case when p_avatar_url is null and p_avatar_original_url is null then null else now() end,
      updated_at = now()
  where id = v_uid;
end;
$$;

revoke all on function public.update_own_avatar_assets(text, text, text, text, text) from public, anon;
grant execute on function public.update_own_avatar_assets(text, text, text, text, text) to authenticated, service_role;

-- 3. Ensure legacy table-level student UPDATE policy remains absent
drop policy if exists "Students can update own avatar_url" on public.profiles;

-- 4. Reload PostgREST schema cache
notify pgrst, 'reload schema';

