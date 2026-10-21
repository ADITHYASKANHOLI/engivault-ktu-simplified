-- ENGIVAULT Database Migration 010: Student Authentication, Profiles, and DB-Backed Rate Limits
-- Idempotent, reversible, and compliant with Vercel serverless requirements.

-- 1. Profiles Table Updates: Add username, unique index, format & reserved word constraints
alter table public.profiles
  add column if not exists username text;

-- Create unique index for case-insensitive username lookup
create unique index if not exists idx_profiles_lower_username
  on public.profiles (lower(username));

-- Enforce lowercase alphanumeric + underscore format (3-20 characters)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_profiles_username_format'
  ) then
    alter table public.profiles
      add constraint chk_profiles_username_format
      check (username ~ '^[a-z0-9_]{3,20}$');
  end if;
end $$;

-- Block reserved usernames from being registered
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_profiles_username_reserved'
  ) then
    alter table public.profiles
      add constraint chk_profiles_username_reserved
      check (lower(username) not in (
        'admin', 'administrator', 'fole', 'engivault', 'root',
        'support', 'system', 'mod', 'moderator', 'staff',
        'superuser', 'guest', 'bot'
      ));
  end if;
end $$;

-- 2. Trigger on auth.users for Automatic Profile Creation
-- Hardcodes role to 'student' and extracts username strictly from user_metadata.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_username text;
  clean_username text;
begin
  raw_username := new.raw_user_meta_data->>'username';
  if raw_username is not null and trim(raw_username) <> '' then
    clean_username := lower(trim(raw_username));
  else
    clean_username := null;
  end if;

  insert into public.profiles (id, display_name, role, username, created_at, updated_at)
  values (
    new.id,
    coalesce(raw_username, split_part(new.email, '@', 1)),
    'student', -- Always hardcoded to 'student'; never trust client metadata for roles
    clean_username,
    now(),
    now()
  )
  on conflict (id) do update set
    username = coalesce(public.profiles.username, excluded.username),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer set search_path = public, auth, pg_temp;

-- Recreate trigger idempotently
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Row Level Security (RLS) on Profiles
-- Verify RLS is enabled
alter table public.profiles enable row level security;

-- Keep profile update capability strictly with administrators
-- Students cannot self-update role or username directly via the anon/authenticated key.
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles for update
  using (public.is_admin());

-- Users can read their own profile, and admins can read all profiles
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- 4. Rate-Limit Storage Table (Accessed via Service Role / Atomic Functions)
create table if not exists public.auth_rate_limits (
  key text primary key,
  count integer not null default 1,
  window_start timestamptz not null default now()
);

alter table public.auth_rate_limits enable row level security;
-- No public policies on auth_rate_limits (access is restricted to service-role & security definers)

-- 5. Atomic Rate-Limiting Function
create or replace function public.check_and_increment_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max_attempts integer
)
returns jsonb as $$
declare
  v_now timestamptz := now();
  v_record public.auth_rate_limits%rowtype;
  v_window_start timestamptz;
  v_reset_in integer;
begin
  select * into v_record from public.auth_rate_limits where key = p_key for update;

  if not found then
    insert into public.auth_rate_limits (key, count, window_start)
    values (p_key, 1, v_now)
    on conflict (key) do update
      set count = public.auth_rate_limits.count + 1;
    return jsonb_build_object(
      'allowed', true,
      'remaining', greatest(0, p_max_attempts - 1),
      'reset_in_seconds', p_window_seconds
    );
  end if;

  -- Check if the active window has expired
  if v_record.window_start + (p_window_seconds || ' seconds')::interval <= v_now then
    update public.auth_rate_limits
    set count = 1, window_start = v_now
    where key = p_key;

    return jsonb_build_object(
      'allowed', true,
      'remaining', greatest(0, p_max_attempts - 1),
      'reset_in_seconds', p_window_seconds
    );
  end if;

  -- Window is currently active
  v_reset_in := greatest(1, ceil(extract(epoch from (v_record.window_start + (p_window_seconds || ' seconds')::interval - v_now))));

  if v_record.count >= p_max_attempts then
    return jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_in_seconds', v_reset_in
    );
  end if;

  update public.auth_rate_limits
  set count = count + 1
  where key = p_key;

  return jsonb_build_object(
    'allowed', true,
    'remaining', greatest(0, p_max_attempts - (v_record.count + 1)),
    'reset_in_seconds', v_reset_in
  );
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- 6. Reload PostgREST schema cache
notify pgrst, 'reload schema';
