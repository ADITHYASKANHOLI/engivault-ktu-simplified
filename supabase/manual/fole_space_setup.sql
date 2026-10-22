-- ==============================================================================
-- FOLE SPACE: CONSOLIDATED MANUAL DATABASE SETUP
-- Target: Supabase PostgreSQL (SQL Editor execution)
-- Purpose: Complete, idempotent setup of FOLE SPACE tables, constraints,
--          indexes, atomic RPC functions, private storage bucket, security
--          hardening, and verification checks.
--
-- Instructions:
-- 1. Open Supabase Dashboard -> select your project (verify NEXT_PUBLIC_SUPABASE_URL).
-- 2. Open SQL Editor -> New query -> Paste this entire file -> Run.
-- 3. Review the verification output table at the bottom.
-- ==============================================================================

-- Ensure safe search path
set search_path = public, pg_temp;

-- ==============================================================================
-- 1. SPACE SETTINGS (Singleton Row: id = 1)
-- ==============================================================================
create table if not exists public.space_settings (
    id int primary key default 1 check (id = 1),
    name text not null default 'FOLE Open Space',
    is_open boolean not null default false,
    capacity int not null default 10 check (capacity > 0),
    session_minutes int not null default 30 check (session_minutes > 0),
    opening_hours jsonb not null default '{}'::jsonb,
    timezone text not null default 'Asia/Kolkata',
    allow_extension boolean not null default true,
    max_sessions_per_day int not null default 4 check (max_sessions_per_day > 0),
    extension_window_minutes int not null default 10 check (extension_window_minutes > 0),
    min_session_minutes int not null default 15 check (min_session_minutes > 0),
    event_checkin_early_minutes int not null default 30 check (event_checkin_early_minutes >= 0),
    event_checkin_grace_minutes int not null default 30 check (event_checkin_grace_minutes >= 0),
    updated_at timestamptz not null default now()
);

-- Reconcile columns if table pre-existed
alter table public.space_settings add column if not exists name text not null default 'FOLE Open Space';
alter table public.space_settings add column if not exists is_open boolean not null default false;
alter table public.space_settings add column if not exists capacity int not null default 10;
alter table public.space_settings add column if not exists session_minutes int not null default 30;
alter table public.space_settings add column if not exists opening_hours jsonb not null default '{}'::jsonb;
alter table public.space_settings add column if not exists timezone text not null default 'Asia/Kolkata';
alter table public.space_settings add column if not exists allow_extension boolean not null default true;
alter table public.space_settings add column if not exists max_sessions_per_day int not null default 4;
alter table public.space_settings add column if not exists extension_window_minutes int not null default 10;
alter table public.space_settings add column if not exists min_session_minutes int not null default 15;
alter table public.space_settings add column if not exists event_checkin_early_minutes int not null default 30;
alter table public.space_settings add column if not exists event_checkin_grace_minutes int not null default 30;
alter table public.space_settings add column if not exists updated_at timestamptz not null default now();

-- Seed initial conservative space settings if not present
insert into public.space_settings (
    id, is_open, capacity, session_minutes, opening_hours, timezone,
    allow_extension, max_sessions_per_day, extension_window_minutes,
    min_session_minutes, event_checkin_early_minutes, event_checkin_grace_minutes
) values (
    1, false, 10, 30, '{}'::jsonb, 'Asia/Kolkata',
    true, 4, 10, 15, 30, 30
)
on conflict (id) do nothing;

-- ==============================================================================
-- 2. SPACE SESSIONS (Walk-in open space check-in records)
-- ==============================================================================
create table if not exists public.space_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    started_at timestamptz not null default now(),
    expires_at timestamptz not null,
    ended_at timestamptz,
    checked_out_at timestamptz,
    status text not null default 'active' check (status in ('active', 'completed', 'expired', 'cancelled')),
    source text not null default 'self' check (source in ('self', 'admin_forced')),
    extension_of uuid references public.space_sessions(id) on delete set null,
    created_at timestamptz not null default now()
);

-- Reconcile columns
alter table public.space_sessions add column if not exists started_at timestamptz not null default now();
alter table public.space_sessions add column if not exists expires_at timestamptz not null default (now() + interval '30 minutes');
alter table public.space_sessions add column if not exists ended_at timestamptz;
alter table public.space_sessions add column if not exists checked_out_at timestamptz;
alter table public.space_sessions add column if not exists status text not null default 'active';
alter table public.space_sessions add column if not exists source text not null default 'self';
alter table public.space_sessions add column if not exists extension_of uuid references public.space_sessions(id) on delete set null;
alter table public.space_sessions add column if not exists created_at timestamptz not null default now();

-- Indexes for performance & concurrency
create unique index if not exists idx_space_active_user_session
on public.space_sessions(user_id)
where checked_out_at is null and status = 'active';

create index if not exists idx_space_sessions_expires_at on public.space_sessions(expires_at);
create index if not exists idx_space_sessions_user_created on public.space_sessions(user_id, created_at desc);

-- ==============================================================================
-- 3. SPACE ORGANIZERS (Verified faculty/student event hosts)
-- ==============================================================================
create table if not exists public.space_organizers (
    user_id uuid primary key references auth.users(id) on delete cascade,
    title text,
    badge text,
    added_by_label text not null default 'Admin',
    added_at timestamptz not null default now(),
    active boolean not null default true,
    deactivated_at timestamptz
);

-- Reconcile columns
alter table public.space_organizers add column if not exists title text;
alter table public.space_organizers add column if not exists badge text;
alter table public.space_organizers add column if not exists added_by_label text not null default 'Admin';
alter table public.space_organizers add column if not exists added_at timestamptz not null default now();
alter table public.space_organizers add column if not exists active boolean not null default true;
alter table public.space_organizers add column if not exists deactivated_at timestamptz;

create index if not exists idx_space_organizers_active on public.space_organizers(active);

-- ==============================================================================
-- 4. SPACE EVENTS
-- ==============================================================================
create table if not exists public.space_events (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    title text not null,
    description text not null,
    organizer_id uuid not null references auth.users(id) on delete cascade,
    category text not null default 'Workshop',
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    timezone text not null default 'Asia/Kolkata',
    capacity int not null check (capacity > 0),
    registration_opens_at timestamptz,
    registration_closes_at timestamptz,
    status text not null default 'draft' check (status in ('draft', 'published', 'live', 'completed', 'cancelled')),
    live_started_at timestamptz,
    live_ended_at timestamptz,
    blocks_open_space boolean not null default true,
    flyer_path text,
    flyer_mime text,
    flyer_width int,
    flyer_height int,
    flyer_bytes bigint,
    allow_virtual_checkin boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    published_at timestamptz,
    cancelled_at timestamptz,
    deleted_at timestamptz,
    constraint chk_space_events_time_order check (ends_at > starts_at)
);

-- Reconcile columns
alter table public.space_events add column if not exists category text not null default 'Workshop';
alter table public.space_events add column if not exists timezone text not null default 'Asia/Kolkata';
alter table public.space_events add column if not exists blocks_open_space boolean not null default true;
alter table public.space_events add column if not exists allow_virtual_checkin boolean not null default true;
alter table public.space_events add column if not exists flyer_path text;
alter table public.space_events add column if not exists flyer_mime text;
alter table public.space_events add column if not exists flyer_width int;
alter table public.space_events add column if not exists flyer_height int;
alter table public.space_events add column if not exists flyer_bytes bigint;
alter table public.space_events add column if not exists live_started_at timestamptz;
alter table public.space_events add column if not exists live_ended_at timestamptz;
alter table public.space_events add column if not exists published_at timestamptz;
alter table public.space_events add column if not exists cancelled_at timestamptz;
alter table public.space_events add column if not exists deleted_at timestamptz;
alter table public.space_events add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_space_events_starts_at on public.space_events(starts_at);
create index if not exists idx_space_events_status on public.space_events(status);
create index if not exists idx_space_events_organizer on public.space_events(organizer_id);

-- ==============================================================================
-- 5. SPACE EVENT REGISTRATIONS (Ticket credentials)
-- ==============================================================================
create table if not exists public.space_event_registrations (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.space_events(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'registered' check (status in ('registered', 'cancelled')),
    ticket_code text unique not null,
    registered_at timestamptz not null default now(),
    cancelled_at timestamptz,
    constraint uq_space_event_user unique (event_id, user_id)
);

-- Reconcile columns
alter table public.space_event_registrations add column if not exists status text not null default 'registered';
alter table public.space_event_registrations add column if not exists ticket_code text;
alter table public.space_event_registrations add column if not exists registered_at timestamptz not null default now();
alter table public.space_event_registrations add column if not exists cancelled_at timestamptz;

create index if not exists idx_space_event_reg_user on public.space_event_registrations(user_id, status);
create index if not exists idx_space_event_reg_code on public.space_event_registrations(ticket_code);

-- ==============================================================================
-- 6. SPACE EVENT CHECK-INS (Attendance records)
-- ==============================================================================
create table if not exists public.space_event_checkins (
    id uuid primary key default gen_random_uuid(),
    registration_id uuid unique not null references public.space_event_registrations(id) on delete cascade,
    event_id uuid not null references public.space_events(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    checked_in_at timestamptz not null default now(),
    method text not null check (method in ('qr', 'virtual', 'manual')),
    checked_in_by uuid references auth.users(id) on delete set null,
    revoked_at timestamptz,
    revoked_by uuid references auth.users(id) on delete set null
);

-- Reconcile columns
alter table public.space_event_checkins add column if not exists method text not null default 'qr';
alter table public.space_event_checkins add column if not exists checked_in_by uuid references auth.users(id) on delete set null;
alter table public.space_event_checkins add column if not exists revoked_at timestamptz;
alter table public.space_event_checkins add column if not exists revoked_by uuid references auth.users(id) on delete set null;

create index if not exists idx_space_checkins_event on public.space_event_checkins(event_id);
create index if not exists idx_space_checkins_user on public.space_event_checkins(user_id);

-- ==============================================================================
-- 7. SPACE AUDIT LOG (Physical singular table)
-- ==============================================================================
create table if not exists public.space_audit_log (
    id uuid primary key default gen_random_uuid(),
    actor_id text not null,
    action text not null,
    target_type text not null,
    target_id text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- Reconcile columns
alter table public.space_audit_log add column if not exists actor_id text not null default 'system';
alter table public.space_audit_log add column if not exists action text not null default '';
alter table public.space_audit_log add column if not exists target_type text not null default '';
alter table public.space_audit_log add column if not exists target_id text not null default '';
alter table public.space_audit_log add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.space_audit_log add column if not exists created_at timestamptz not null default now();

create index if not exists idx_space_audit_log_created on public.space_audit_log(created_at desc);
create index if not exists idx_space_audit_log_target on public.space_audit_log(target_type, target_id);
create index if not exists idx_space_audit_log_actor on public.space_audit_log(actor_id);

-- Safe migration from legacy plural table if it existed as a base table
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'space_audit_logs' and table_type = 'BASE TABLE'
  ) then
    insert into public.space_audit_log (id, actor_id, action, target_type, target_id, metadata, created_at)
    select id, actor_id, action, target_type, target_id, metadata, created_at
    from public.space_audit_logs
    on conflict (id) do nothing;
    drop table public.space_audit_logs;
  end if;
end $$;

-- Plural compatibility view
create or replace view public.space_audit_logs as
select * from public.space_audit_log;

-- Reconcile Supabase CLI migration tracking if supabase_migrations exists
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'supabase_migrations' and table_name = 'schema_migrations'
  ) then
    insert into supabase_migrations.schema_migrations (version)
    values ('011'), ('012'), ('011_fole_space_system'), ('012_fole_space_security_hardening')
    on conflict do nothing;
  end if;
end $$;

-- ==============================================================================
-- 8. STORAGE BUCKET: fole-space-flyers (Private bucket, server-proxied delivery)
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'fole-space-flyers',
    'fole-space-flyers',
    false,
    10485760, -- 10MB
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- SECURITY FIX: Drop any unrestricted storage select policy
drop policy if exists "space_flyers_read" on storage.objects;

-- ==============================================================================
-- 9. ATOMIC SECURITY DEFINER RPC FUNCTIONS
-- ==============================================================================

-- A. Open Space Walk-in Check-In
create or replace function public.rpc_space_checkin(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_settings public.space_settings%rowtype;
    v_now timestamptz := now();
    v_active_session public.space_sessions%rowtype;
    v_occupancy int;
    v_today_start timestamptz;
    v_sessions_today int;
    v_next_event_start timestamptz;
    v_session_expires timestamptz;
    v_available_minutes int;
    v_new_session public.space_sessions%rowtype;
begin
    -- 1. Check if user already has an active session (Idempotent return)
    select * into v_active_session
    from public.space_sessions
    where user_id = p_user_id
      and checked_out_at is null
      and status = 'active'
      and expires_at > v_now;

    if found then
        return jsonb_build_object(
            'success', true,
            'idempotent', true,
            'session', row_to_json(v_active_session),
            'server_now', v_now
        );
    end if;

    -- Clean up any stale active sessions for this user that expired
    update public.space_sessions
    set status = 'expired', ended_at = expires_at
    where user_id = p_user_id
      and checked_out_at is null
      and status = 'active'
      and expires_at <= v_now;

    -- 2. Lock space_settings for concurrency control
    select * into v_settings
    from public.space_settings
    where id = 1
    for update;

    if not found or not v_settings.is_open then
        return jsonb_build_object('success', false, 'error', 'FOLE Space is currently closed.');
    end if;

    -- 3. Check blocking live/imminent events
    select min(starts_at) into v_next_event_start
    from public.space_events
    where blocks_open_space = true
      and status in ('published', 'live')
      and deleted_at is null
      and ends_at > v_now
      and starts_at <= (v_now + (v_settings.session_minutes || ' minutes')::interval);

    if exists (
        select 1 from public.space_events
        where blocks_open_space = true
          and status = 'live'
          and deleted_at is null
          and starts_at <= v_now
          and ends_at > v_now
    ) then
        return jsonb_build_object('success', false, 'error', 'The space is currently reserved for a live event.');
    end if;

    -- 4. Check current live occupancy under row lock
    select count(*) into v_occupancy
    from public.space_sessions
    where checked_out_at is null
      and status = 'active'
      and expires_at > v_now;

    if v_occupancy >= v_settings.capacity then
        return jsonb_build_object('success', false, 'error', 'Space is currently at maximum capacity (' || v_settings.capacity || ' seats).');
    end if;

    -- 5. Check daily session limit
    v_today_start := date_trunc('day', v_now at time zone v_settings.timezone) at time zone v_settings.timezone;
    select count(*) into v_sessions_today
    from public.space_sessions
    where user_id = p_user_id
      and started_at >= v_today_start
      and status in ('active', 'completed', 'expired');

    if v_sessions_today >= v_settings.max_sessions_per_day then
        return jsonb_build_object('success', false, 'error', 'Daily session limit reached (' || v_settings.max_sessions_per_day || ' sessions).');
    end if;

    -- 6. Calculate session expiry time
    v_session_expires := v_now + (v_settings.session_minutes || ' minutes')::interval;
    if v_next_event_start is not null and v_next_event_start < v_session_expires then
        v_available_minutes := extract(epoch from (v_next_event_start - v_now)) / 60;
        if v_available_minutes < v_settings.min_session_minutes then
            return jsonb_build_object('success', false, 'error', 'An event is scheduled to start shortly. Walk-in check-in is paused.');
        end if;
        v_session_expires := v_next_event_start;
    end if;

    -- 7. Insert new active session
    insert into public.space_sessions (
        user_id,
        started_at,
        expires_at,
        status,
        source
    ) values (
        p_user_id,
        v_now,
        v_session_expires,
        'active',
        'self'
    )
    returning * into v_new_session;

    -- Audit log (insert into singular space_audit_log)
    insert into public.space_audit_log (actor_id, action, target_type, target_id, metadata)
    values (p_user_id::text, 'open_space_checkin', 'space_session', v_new_session.id::text, jsonb_build_object(
        'expires_at', v_session_expires,
        'occupancy_after', v_occupancy + 1
    ));

    return jsonb_build_object(
        'success', true,
        'idempotent', false,
        'session', row_to_json(v_new_session),
        'server_now', v_now
    );
end;
$$;

-- B. Open Space Walk-in Check-Out
create or replace function public.rpc_space_checkout(p_user_id uuid, p_session_id uuid, p_source text default 'self')
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_session public.space_sessions%rowtype;
    v_now timestamptz := now();
begin
    select * into v_session
    from public.space_sessions
    where id = p_session_id
    for update;

    if not found then
        return jsonb_build_object('success', false, 'error', 'Session not found.');
    end if;

    if v_session.checked_out_at is not null then
        return jsonb_build_object('success', true, 'session', row_to_json(v_session), 'message', 'Already checked out.');
    end if;

    update public.space_sessions
    set checked_out_at = v_now,
        ended_at = v_now,
        status = 'completed',
        source = coalesce(p_source, 'self')
    where id = p_session_id
    returning * into v_session;

    -- Audit log
    insert into public.space_audit_log (actor_id, action, target_type, target_id, metadata)
    values (coalesce(p_user_id::text, 'admin'), 'open_space_checkout', 'space_session', p_session_id::text, jsonb_build_object(
        'source', p_source,
        'duration_seconds', extract(epoch from (v_now - v_session.started_at))
    ));

    return jsonb_build_object('success', true, 'session', row_to_json(v_session));
end;
$$;

-- C. Open Space Session Extension
create or replace function public.rpc_space_extend(p_user_id uuid, p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_settings public.space_settings%rowtype;
    v_now timestamptz := now();
    v_session public.space_sessions%rowtype;
    v_occupancy int;
    v_next_event_start timestamptz;
    v_new_expires timestamptz;
    v_available_minutes int;
begin
    select * into v_session
    from public.space_sessions
    where id = p_session_id
      and user_id = p_user_id
    for update;

    if not found then
        return jsonb_build_object('success', false, 'error', 'Active session not found.');
    end if;

    if v_session.checked_out_at is not null or v_session.status != 'active' then
        return jsonb_build_object('success', false, 'error', 'Session has already ended.');
    end if;

    select * into v_settings from public.space_settings where id = 1 for update;
    if not found or not v_settings.is_open or not v_settings.allow_extension then
        return jsonb_build_object('success', false, 'error', 'Session extensions are currently disabled.');
    end if;

    if (v_session.expires_at - v_now) > (v_settings.extension_window_minutes || ' minutes')::interval then
        return jsonb_build_object('success', false, 'error', 'Extensions are only permitted within ' || v_settings.extension_window_minutes || ' minutes of session expiry.');
    end if;

    select count(*) into v_occupancy
    from public.space_sessions
    where checked_out_at is null
      and status = 'active'
      and expires_at > v_now;

    if v_occupancy >= v_settings.capacity then
        return jsonb_build_object('success', false, 'error', 'Cannot extend: space is currently at maximum capacity.');
    end if;

    v_new_expires := greatest(v_session.expires_at, v_now) + (v_settings.session_minutes || ' minutes')::interval;

    select min(starts_at) into v_next_event_start
    from public.space_events
    where blocks_open_space = true
      and status in ('published', 'live')
      and deleted_at is null
      and ends_at > v_now
      and starts_at <= v_new_expires;

    if v_next_event_start is not null and v_next_event_start < v_new_expires then
        v_available_minutes := extract(epoch from (v_next_event_start - greatest(v_session.expires_at, v_now))) / 60;
        if v_available_minutes < v_settings.min_session_minutes then
            return jsonb_build_object('success', false, 'error', 'Cannot extend: an event starts shortly.');
        end if;
        v_new_expires := v_next_event_start;
    end if;

    update public.space_sessions
    set expires_at = v_new_expires
    where id = p_session_id
    returning * into v_session;

    -- Audit log
    insert into public.space_audit_log (actor_id, action, target_type, target_id, metadata)
    values (p_user_id::text, 'open_space_extend', 'space_session', p_session_id::text, jsonb_build_object(
        'extended_until', v_new_expires
    ));

    return jsonb_build_object('success', true, 'session', row_to_json(v_session));
end;
$$;

-- D. Event Registration with Atomic Capacity Lock
create or replace function public.rpc_space_register_event(p_user_id uuid, p_event_id uuid, p_ticket_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_event public.space_events%rowtype;
    v_reg public.space_event_registrations%rowtype;
    v_reg_count int;
    v_now timestamptz := now();
begin
    select * into v_reg
    from public.space_event_registrations
    where event_id = p_event_id and user_id = p_user_id;

    if found and v_reg.status = 'registered' then
        return jsonb_build_object('success', true, 'idempotent', true, 'registration', row_to_json(v_reg));
    end if;

    select * into v_event
    from public.space_events
    where id = p_event_id and deleted_at is null
    for update;

    if not found then
        return jsonb_build_object('success', false, 'error', 'Event not found.');
    end if;

    if v_event.status not in ('published', 'live') then
        return jsonb_build_object('success', false, 'error', 'Registration is closed for this event.');
    end if;

    if v_event.registration_opens_at is not null and v_now < v_event.registration_opens_at then
        return jsonb_build_object('success', false, 'error', 'Registration has not opened yet.');
    end if;

    if v_event.registration_closes_at is not null and v_now > v_event.registration_closes_at then
        return jsonb_build_object('success', false, 'error', 'Registration has closed for this event.');
    end if;

    select count(*) into v_reg_count
    from public.space_event_registrations
    where event_id = p_event_id and status = 'registered';

    if v_reg_count >= v_event.capacity then
        return jsonb_build_object('success', false, 'error', 'This event has reached full capacity (' || v_event.capacity || ' seats).');
    end if;

    if found and v_reg.status = 'cancelled' then
        update public.space_event_registrations
        set status = 'registered',
            ticket_code = p_ticket_code,
            registered_at = v_now,
            cancelled_at = null
        where id = v_reg.id
        returning * into v_reg;
    else
        insert into public.space_event_registrations (
            event_id, user_id, status, ticket_code, registered_at
        ) values (
            p_event_id, p_user_id, 'registered', p_ticket_code, v_now
        )
        returning * into v_reg;
    end if;

    -- Audit log
    insert into public.space_audit_log (actor_id, action, target_type, target_id, metadata)
    values (p_user_id::text, 'event_register', 'space_event_registration', v_reg.id::text, jsonb_build_object(
        'event_id', p_event_id,
        'ticket_code', p_ticket_code
    ));

    return jsonb_build_object('success', true, 'idempotent', false, 'registration', row_to_json(v_reg));
end;
$$;

-- E. Cancel Event Registration
create or replace function public.rpc_space_cancel_registration(p_user_id uuid, p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_reg public.space_event_registrations%rowtype;
begin
    select * into v_reg
    from public.space_event_registrations
    where event_id = p_event_id and user_id = p_user_id
    for update;

    if not found or v_reg.status = 'cancelled' then
        return jsonb_build_object('success', true, 'message', 'Registration already cancelled.');
    end if;

    update public.space_event_registrations
    set status = 'cancelled',
        cancelled_at = now()
    where id = v_reg.id
    returning * into v_reg;

    -- Audit log
    insert into public.space_audit_log (actor_id, action, target_type, target_id, metadata)
    values (p_user_id::text, 'event_cancel_registration', 'space_event_registration', v_reg.id::text, jsonb_build_object(
        'event_id', p_event_id
    ));

    return jsonb_build_object('success', true, 'registration', row_to_json(v_reg));
end;
$$;

-- F. Event QR/Ticket Check-In at Desk
create or replace function public.rpc_space_checkin_ticket(
    p_ticket_code text,
    p_expected_event_id uuid,
    p_method text default 'qr',
    p_scanner_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_reg public.space_event_registrations%rowtype;
    v_event public.space_events%rowtype;
    v_settings public.space_settings%rowtype;
    v_existing_checkin public.space_event_checkins%rowtype;
    v_new_checkin public.space_event_checkins%rowtype;
    v_attendee_profile record;
    v_now timestamptz := now();
    v_early_window interval;
    v_grace_window interval;
begin
    select * into v_reg
    from public.space_event_registrations
    where ticket_code = p_ticket_code;

    if not found then
        return jsonb_build_object('success', false, 'error', 'Invalid ticket code. No matching registration found.');
    end if;

    if v_reg.event_id != p_expected_event_id then
        return jsonb_build_object('success', false, 'error', 'This ticket belongs to a different event.');
    end if;

    if v_reg.status != 'registered' then
        return jsonb_build_object('success', false, 'error', 'This registration was cancelled.');
    end if;

    select * into v_event
    from public.space_events
    where id = p_expected_event_id and deleted_at is null;

    if not found then
        return jsonb_build_object('success', false, 'error', 'Event not found.');
    end if;

    select * into v_settings from public.space_settings where id = 1;
    v_early_window := (coalesce(v_settings.event_checkin_early_minutes, 30) || ' minutes')::interval;
    v_grace_window := (coalesce(v_settings.event_checkin_grace_minutes, 30) || ' minutes')::interval;

    if v_now < (v_event.starts_at - v_early_window) then
        return jsonb_build_object('success', false, 'error', 'Check-in has not opened yet. Check-in opens 30 minutes before event start.');
    end if;

    if v_now > (v_event.ends_at + v_grace_window) then
        return jsonb_build_object('success', false, 'error', 'Check-in window for this event has expired.');
    end if;

    select * into v_existing_checkin
    from public.space_event_checkins
    where registration_id = v_reg.id and revoked_at is null;

    if found then
        return jsonb_build_object(
            'success', false,
            'already_checked_in', true,
            'error', 'Attendee is already checked in.',
            'checkin', row_to_json(v_existing_checkin)
        );
    end if;

    insert into public.space_event_checkins (
        registration_id, event_id, user_id, checked_in_at, method, checked_in_by
    ) values (
        v_reg.id, p_expected_event_id, v_reg.user_id, v_now, coalesce(p_method, 'qr'), p_scanner_id
    )
    returning * into v_new_checkin;

    select id, username, display_name into v_attendee_profile
    from public.profiles
    where id = v_reg.user_id;

    -- Audit log
    insert into public.space_audit_log (actor_id, action, target_type, target_id, metadata)
    values (coalesce(p_scanner_id::text, 'desk'), 'event_ticket_checkin', 'space_event_checkin', v_new_checkin.id::text, jsonb_build_object(
        'event_id', p_expected_event_id,
        'user_id', v_reg.user_id,
        'method', p_method,
        'ticket_code', p_ticket_code
    ));

    return jsonb_build_object(
        'success', true,
        'checkin', row_to_json(v_new_checkin),
        'attendee', jsonb_build_object(
            'id', v_attendee_profile.id,
            'username', v_attendee_profile.username,
            'display_name', v_attendee_profile.display_name
        )
    );
end;
$$;

-- G. Virtual (QR-free) Check-In
create or replace function public.rpc_space_virtual_checkin(p_user_id uuid, p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_event public.space_events%rowtype;
    v_reg public.space_event_registrations%rowtype;
    v_existing_checkin public.space_event_checkins%rowtype;
    v_new_checkin public.space_event_checkins%rowtype;
    v_now timestamptz := now();
begin
    select * into v_event
    from public.space_events
    where id = p_event_id and deleted_at is null;

    if not found then
        return jsonb_build_object('success', false, 'error', 'Event not found.');
    end if;

    if v_event.status != 'live' then
        return jsonb_build_object('success', false, 'error', 'Virtual check-in is only available while the organizer has the event set to Live.');
    end if;

    if not v_event.allow_virtual_checkin then
        return jsonb_build_object('success', false, 'error', 'Virtual check-in is not permitted for this event.');
    end if;

    select * into v_reg
    from public.space_event_registrations
    where event_id = p_event_id and user_id = p_user_id and status = 'registered';

    if not found then
        return jsonb_build_object('success', false, 'error', 'You must register for this event before checking in.');
    end if;

    select * into v_existing_checkin
    from public.space_event_checkins
    where registration_id = v_reg.id and revoked_at is null;

    if found then
        return jsonb_build_object('success', true, 'already_checked_in', true, 'checkin', row_to_json(v_existing_checkin));
    end if;

    insert into public.space_event_checkins (
        registration_id, event_id, user_id, checked_in_at, method, checked_in_by
    ) values (
        v_reg.id, p_event_id, p_user_id, v_now, 'virtual', p_user_id
    )
    returning * into v_new_checkin;

    -- Audit log
    insert into public.space_audit_log (actor_id, action, target_type, target_id, metadata)
    values (p_user_id::text, 'event_virtual_checkin', 'space_event_checkin', v_new_checkin.id::text, jsonb_build_object(
        'event_id', p_event_id
    ));

    return jsonb_build_object('success', true, 'already_checked_in', false, 'checkin', row_to_json(v_new_checkin));
end;
$$;

-- H. Revoke Event Check-In (Undo from desk)
create or replace function public.rpc_space_revoke_checkin(p_checkin_id uuid, p_revoker_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_checkin public.space_event_checkins%rowtype;
begin
    select * into v_checkin
    from public.space_event_checkins
    where id = p_checkin_id and revoked_at is null
    for update;

    if not found then
        return jsonb_build_object('success', false, 'error', 'Active check-in record not found.');
    end if;

    update public.space_event_checkins
    set revoked_at = now(),
        revoked_by = p_revoker_id
    where id = p_checkin_id
    returning * into v_checkin;

    -- Audit log
    insert into public.space_audit_log (actor_id, action, target_type, target_id, metadata)
    values (coalesce(p_revoker_id::text, 'desk'), 'event_checkin_revoked', 'space_event_checkin', p_checkin_id::text, jsonb_build_object(
        'event_id', v_checkin.event_id,
        'user_id', v_checkin.user_id
    ));

    return jsonb_build_object('success', true, 'checkin', row_to_json(v_checkin));
end;
$$;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- ==============================================================================

alter table public.space_settings enable row level security;
alter table public.space_sessions enable row level security;
alter table public.space_organizers enable row level security;
alter table public.space_events enable row level security;
alter table public.space_event_registrations enable row level security;
alter table public.space_event_checkins enable row level security;
alter table public.space_audit_log enable row level security;

-- Table-level write revocations: anonymous and authenticated clients cannot perform direct mutations
revoke insert, update, delete on public.space_settings from public, anon, authenticated;
revoke insert, update, delete on public.space_sessions from public, anon, authenticated;
revoke insert, update, delete on public.space_organizers from public, anon, authenticated;
revoke insert, update, delete on public.space_events from public, anon, authenticated;
revoke insert, update, delete on public.space_event_registrations from public, anon, authenticated;
revoke insert, update, delete on public.space_event_checkins from public, anon, authenticated;
revoke all on public.space_audit_log from public, anon, authenticated;
revoke all on public.space_audit_logs from public, anon, authenticated;

-- Grants to service_role for trusted server-side execution
grant all on public.space_settings to service_role;
grant all on public.space_sessions to service_role;
grant all on public.space_organizers to service_role;
grant all on public.space_events to service_role;
grant all on public.space_event_registrations to service_role;
grant all on public.space_event_checkins to service_role;
grant all on public.space_audit_log to service_role;
grant select on public.space_audit_logs to service_role;

-- 1. Space Settings: Public read of safe fields permitted
drop policy if exists "space_settings_read" on public.space_settings;
create policy "space_settings_read" on public.space_settings for select using (true);
grant select on public.space_settings to anon, authenticated;

-- 2. Space Sessions: Users can select only their own sessions
drop policy if exists "space_sessions_select_own" on public.space_sessions;
create policy "space_sessions_select_own" on public.space_sessions for select to authenticated using (user_id = auth.uid());
grant select on public.space_sessions to authenticated;

-- 3. Space Organizers: Public can check active organizers
drop policy if exists "space_organizers_select" on public.space_organizers;
create policy "space_organizers_select" on public.space_organizers for select using (active = true);
grant select on public.space_organizers to anon, authenticated;

-- 4. Space Events: Public can read published/live/completed non-deleted events; Organizers can read their own drafts
drop policy if exists "space_events_public_select" on public.space_events;
create policy "space_events_public_select" on public.space_events for select using (
    deleted_at is null and (
        status in ('published', 'live', 'completed')
        or (auth.uid() is not null and organizer_id = auth.uid())
    )
);
grant select on public.space_events to anon, authenticated;

-- 5. Registrations: Users can select only their own registrations; organizers can see registrations for their events
drop policy if exists "space_registrations_select_own" on public.space_event_registrations;
create policy "space_registrations_select_own" on public.space_event_registrations for select to authenticated using (
    user_id = auth.uid()
    or exists (
        select 1 from public.space_events
        where id = event_id and organizer_id = auth.uid() and deleted_at is null
    )
);
grant select on public.space_event_registrations to authenticated;

-- 6. Check-Ins: Users can select their own check-in; organizers can see check-ins for their events
drop policy if exists "space_checkins_select_own" on public.space_event_checkins;
create policy "space_checkins_select_own" on public.space_event_checkins for select to authenticated using (
    user_id = auth.uid()
    or exists (
        select 1 from public.space_events
        where id = event_id and organizer_id = auth.uid() and deleted_at is null
    )
);
grant select on public.space_event_checkins to authenticated;

-- 7. Audit log: Service-role only (no public/authenticated policies granted)

-- RPC Security: Revoke public execution and restrict strictly to service_role
revoke all on function public.rpc_space_checkin(uuid) from public, anon, authenticated;
grant execute on function public.rpc_space_checkin(uuid) to service_role;

revoke all on function public.rpc_space_checkout(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.rpc_space_checkout(uuid, uuid, text) to service_role;

revoke all on function public.rpc_space_extend(uuid, uuid) from public, anon, authenticated;
grant execute on function public.rpc_space_extend(uuid, uuid) to service_role;

revoke all on function public.rpc_space_register_event(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.rpc_space_register_event(uuid, uuid, text) to service_role;

revoke all on function public.rpc_space_cancel_registration(uuid, uuid) from public, anon, authenticated;
grant execute on function public.rpc_space_cancel_registration(uuid, uuid) to service_role;

revoke all on function public.rpc_space_checkin_ticket(text, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.rpc_space_checkin_ticket(text, uuid, text, uuid) to service_role;

revoke all on function public.rpc_space_virtual_checkin(uuid, uuid) from public, anon, authenticated;
grant execute on function public.rpc_space_virtual_checkin(uuid, uuid) to service_role;

revoke all on function public.rpc_space_revoke_checkin(uuid, uuid) from public, anon, authenticated;
grant execute on function public.rpc_space_revoke_checkin(uuid, uuid) to service_role;

-- ==============================================================================
-- 11. POSTGREST SCHEMA CACHE RELOAD
-- ==============================================================================
notify pgrst, 'reload schema';

-- ==============================================================================
-- 12. AUTOMATED POST-SETUP VERIFICATION BLOCK
-- ==============================================================================

-- Check 1: Verify all 7 core tables exist with Row Level Security enabled (Explicit row per table)
with expected_tables as (
  select * from (values
    ('space_settings'),
    ('space_sessions'),
    ('space_organizers'),
    ('space_events'),
    ('space_event_registrations'),
    ('space_event_checkins'),
    ('space_audit_log')
  ) as t(table_name)
)
select
    e.table_name,
    case when c.relname is not null then true else false end as table_exists,
    coalesce(c.relrowsecurity, false) as rls_enabled,
    case
        when c.relname is null then 'FAIL (Table Missing)'
        when c.relrowsecurity = false then 'FAIL (RLS Disabled)'
        else 'PASS'
    end as verification
from expected_tables e
left join pg_catalog.pg_class c on c.relname = e.table_name
left join pg_catalog.pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
order by e.table_name;

-- Check 1b: Verify backward-compatibility view space_audit_logs exists
with expected_views as (
  select 'space_audit_logs' as view_name
)
select
    e.view_name,
    case when v.table_name is not null then true else false end as view_exists,
    case
        when v.table_name is null then 'FAIL (Compatibility View Missing)'
        else 'PASS'
    end as verification
from expected_views e
left join information_schema.views v
  on v.table_schema = 'public' and v.table_name = e.view_name;

-- Check 2: Verify singleton settings row id = 1 exists with expected defaults (Guaranteed row output)
select
    1 as expected_id,
    s.id as found_id,
    s.is_open,
    s.capacity,
    s.session_minutes,
    s.timezone,
    s.opening_hours,
    case
        when s.id is null then 'FAIL (Settings Row id=1 Missing)'
        when s.id = 1 and s.timezone = 'Asia/Kolkata' and s.capacity > 0 and s.session_minutes > 0 then 'PASS'
        else 'FAIL (Invalid Settings Values)'
    end as verification
from (select 1 as dummy_id) d
left join public.space_settings s on s.id = 1;

-- Check 3: Verify all 8 atomic RPC functions (Exact signature, SECURITY DEFINER, search_path, grants)
with expected_rpcs as (
  select * from (values
    ('rpc_space_checkin', 'uuid'),
    ('rpc_space_checkout', 'uuid, uuid, text'),
    ('rpc_space_extend', 'uuid, uuid'),
    ('rpc_space_register_event', 'uuid, uuid, text'),
    ('rpc_space_cancel_registration', 'uuid, uuid'),
    ('rpc_space_checkin_ticket', 'text, uuid, text, uuid'),
    ('rpc_space_virtual_checkin', 'uuid, uuid'),
    ('rpc_space_revoke_checkin', 'uuid, uuid')
  ) as r(proname, expected_args)
)
select
    e.proname as routine_name,
    e.expected_args,
    case when p.oid is not null then true else false end as function_exists,
    coalesce(p.prosecdef, false) as is_security_definer,
    coalesce(p.proconfig::text like '%search_path=public, pg_temp%', false) as search_path_hardened,
    coalesce(has_function_privilege('service_role', p.oid, 'EXECUTE'), false) as service_role_can_execute,
    coalesce(has_function_privilege('anon', p.oid, 'EXECUTE'), true) as anon_can_execute,
    case
        when p.oid is null then 'FAIL (Function Missing)'
        when p.prosecdef = false then 'FAIL (Not SECURITY DEFINER)'
        when not (p.proconfig::text like '%search_path=public, pg_temp%') then 'FAIL (Insecure search_path)'
        when not has_function_privilege('service_role', p.oid, 'EXECUTE') then 'FAIL (service_role denied)'
        when has_function_privilege('anon', p.oid, 'EXECUTE') then 'FAIL (anon granted execute)'
        else 'PASS'
    end as verification
from expected_rpcs e
left join pg_catalog.pg_proc p
  on p.proname = e.proname
  and pg_catalog.pg_get_function_identity_arguments(p.oid) = e.expected_args
left join pg_catalog.pg_namespace n
  on n.oid = p.pronamespace and n.nspname = 'public'
order by e.proname;

-- Check 4: Verify fole-space-flyers private storage bucket exists and is private (Guaranteed row output)
with expected_bucket as (
  select 'fole-space-flyers' as bucket_id
)
select
    e.bucket_id,
    case when b.id is not null then true else false end as bucket_exists,
    coalesce(b.public, true) as is_public,
    b.file_size_limit,
    case
        when b.id is null then 'FAIL (Bucket Missing)'
        when b.public = true then 'FAIL (Bucket is Public)'
        else 'PASS'
    end as verification
from expected_bucket e
left join storage.buckets b on b.id = e.bucket_id;

-- Check 5: Comprehensive evaluation of Storage policies on storage.objects for fole-space-flyers
with matching_policies as (
  select
    policyname,
    cmd,
    roles::text as target_roles,
    qual
  from pg_catalog.pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and (
      policyname = 'space_flyers_read'
      or qual ilike '%fole-space-flyers%'
      or with_check ilike '%fole-space-flyers%'
    )
)
select
    coalesce(m.policyname, 'NONE') as policy_name,
    coalesce(m.cmd, 'NONE') as command,
    coalesce(m.target_roles, 'NONE') as roles,
    case
        when count(m.policyname) over () = 0 then 'PASS (No permissive policies on fole-space-flyers)'
        else 'FAIL (Unintended policy exists: ' || m.policyname || ')'
    end as verification
from (select 1 as dummy) d
left join matching_policies m on true;

-- Check 6: Consolidated FOLE SPACE Setup Health Summary
with
  table_failures as (
    select count(*) as cnt from (values
      ('space_settings'), ('space_sessions'), ('space_organizers'),
      ('space_events'), ('space_event_registrations'), ('space_event_checkins'),
      ('space_audit_log')
    ) as t(tbl)
    left join pg_catalog.pg_class c on c.relname = t.tbl
    left join pg_catalog.pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
    where c.relname is null or c.relrowsecurity = false
  ),
  settings_failures as (
    select count(*) as cnt from (select 1 as dummy) d
    left join public.space_settings s on s.id = 1
    where s.id is null or s.timezone != 'Asia/Kolkata' or s.capacity <= 0 or s.session_minutes <= 0
  ),
  rpc_failures as (
    select count(*) as cnt from (values
      ('rpc_space_checkin', 'uuid'),
      ('rpc_space_checkout', 'uuid, uuid, text'),
      ('rpc_space_extend', 'uuid, uuid'),
      ('rpc_space_register_event', 'uuid, uuid, text'),
      ('rpc_space_cancel_registration', 'uuid, uuid'),
      ('rpc_space_checkin_ticket', 'text, uuid, text, uuid'),
      ('rpc_space_virtual_checkin', 'uuid, uuid'),
      ('rpc_space_revoke_checkin', 'uuid, uuid')
    ) as r(proname, expected_args)
    left join pg_catalog.pg_proc p
      on p.proname = r.proname and pg_catalog.pg_get_function_identity_arguments(p.oid) = r.expected_args
    left join pg_catalog.pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
    where p.oid is null
       or p.prosecdef = false
       or not (p.proconfig::text like '%search_path=public, pg_temp%')
       or not has_function_privilege('service_role', p.oid, 'EXECUTE')
       or has_function_privilege('anon', p.oid, 'EXECUTE')
  ),
  bucket_failures as (
    select count(*) as cnt from storage.buckets
    where id = 'fole-space-flyers' and public = true
    union all
    select case when count(*) = 0 then 1 else 0 end from storage.buckets where id = 'fole-space-flyers'
  ),
  policy_failures as (
    select count(*) as cnt from pg_catalog.pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (policyname = 'space_flyers_read' or qual ilike '%fole-space-flyers%')
  )
select
    case
        when (select cnt from table_failures) > 0 then 'FAIL: One or more tables missing or RLS disabled'
        when (select cnt from settings_failures) > 0 then 'FAIL: Space settings row 1 missing or invalid'
        when (select cnt from rpc_failures) > 0 then 'FAIL: One or more RPCs missing, not definer, unhardened search_path, or invalid privileges'
        when (select sum(cnt) from bucket_failures) > 0 then 'FAIL: Flyer bucket missing or public'
        when (select cnt from policy_failures) > 0 then 'FAIL: Permissive flyer storage policy exists'
        else 'ALL_CHECKS_PASSED'
    end as overall_status,
    now() as verified_at;

-- Final reload schema notification
notify pgrst, 'reload schema';

-- ==============================================================================
-- ROLLBACK NOTES (For reference only - DO NOT execute during regular setup)
-- ==============================================================================
-- WARNING: Running destructive rollback commands will permanently erase all FOLE SPACE data.
-- To completely remove all FOLE SPACE objects:
--   drop view if exists public.space_audit_logs;
--   drop table if exists public.space_audit_log cascade;
--   drop table if exists public.space_event_checkins cascade;
--   drop table if exists public.space_event_registrations cascade;
--   drop table if exists public.space_events cascade;
--   drop table if exists public.space_organizers cascade;
--   drop table if exists public.space_sessions cascade;
--   drop table if exists public.space_settings cascade;
--   drop function if exists public.rpc_space_checkin(uuid);
--   drop function if exists public.rpc_space_checkout(uuid, uuid, text);
--   drop function if exists public.rpc_space_extend(uuid, uuid);
--   drop function if exists public.rpc_space_register_event(uuid, uuid, text);
--   drop function if exists public.rpc_space_cancel_registration(uuid, uuid);
--   drop function if exists public.rpc_space_checkin_ticket(text, uuid, text, uuid);
--   drop function if exists public.rpc_space_virtual_checkin(uuid, uuid);
--   drop function if exists public.rpc_space_revoke_checkin(uuid, uuid);
--   delete from storage.buckets where id = 'fole-space-flyers';
--   notify pgrst, 'reload schema';
