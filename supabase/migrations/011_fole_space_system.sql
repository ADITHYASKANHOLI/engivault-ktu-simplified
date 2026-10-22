-- ==============================================================================
-- Migration 011: FOLE SPACE System
-- Open space walk-in check-in, verified organizers, events, QR tickets,
-- check-in desk, virtual check-in, and audit logging.
-- Idempotent, safe, and fully reversible.
-- ==============================================================================

-- 1. Space Settings (Singleton row)
create table if not exists public.space_settings (
    id int primary key default 1 check (id = 1),
    name text not null default 'FOLE Open Space',
    is_open boolean not null default false,
    capacity int not null default 10 check (capacity > 0),
    session_minutes int not null default 30 check (session_minutes > 0),
    opening_hours jsonb not null default '{
      "monday": {"open": "09:00", "close": "18:00", "closed": false},
      "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
      "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
      "thursday": {"open": "09:00", "close": "18:00", "closed": false},
      "friday": {"open": "09:00", "close": "18:00", "closed": false},
      "saturday": {"open": "10:00", "close": "16:00", "closed": false},
      "sunday": {"open": "10:00", "close": "16:00", "closed": true}
    }'::jsonb,
    timezone text not null default 'Asia/Kolkata',
    allow_extension boolean not null default true,
    max_sessions_per_day int not null default 4 check (max_sessions_per_day > 0),
    extension_window_minutes int not null default 10 check (extension_window_minutes > 0),
    min_session_minutes int not null default 15 check (min_session_minutes > 0),
    event_checkin_early_minutes int not null default 30 check (event_checkin_early_minutes >= 0),
    event_checkin_grace_minutes int not null default 30 check (event_checkin_grace_minutes >= 0),
    updated_at timestamptz not null default now()
);

-- Seed initial conservative space settings if not present
insert into public.space_settings (id, is_open, capacity, session_minutes)
values (1, false, 10, 30)
on conflict (id) do nothing;

-- 2. Space Sessions (Walk-in open space check-in records)
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

-- Partial unique index: A user may have only ONE active open-space session at any given time
create unique index if not exists idx_space_active_user_session 
on public.space_sessions(user_id) 
where checked_out_at is null and status = 'active';

create index if not exists idx_space_sessions_expires_at on public.space_sessions(expires_at);
create index if not exists idx_space_sessions_user_created on public.space_sessions(user_id, created_at desc);

-- 3. Space Organizers (Verified students authorized to create & host events)
create table if not exists public.space_organizers (
    user_id uuid primary key references auth.users(id) on delete cascade,
    added_by_label text not null default 'Admin',
    added_at timestamptz not null default now(),
    active boolean not null default true,
    deactivated_at timestamptz
);

create index if not exists idx_space_organizers_active on public.space_organizers(active);

-- 4. Space Events
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

create index if not exists idx_space_events_starts_at on public.space_events(starts_at);
create index if not exists idx_space_events_status on public.space_events(status);
create index if not exists idx_space_events_organizer on public.space_events(organizer_id);

-- 5. Space Event Registrations (Ticket credentials)
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

create index if not exists idx_space_event_reg_user on public.space_event_registrations(user_id, status);
create index if not exists idx_space_event_reg_code on public.space_event_registrations(ticket_code);

-- 6. Space Event Check-Ins (Attendance records)
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

create index if not exists idx_space_checkins_event on public.space_event_checkins(event_id);
create index if not exists idx_space_checkins_user on public.space_event_checkins(user_id);

-- 7. Space Audit Logs
create table if not exists public.space_audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id text not null,
    action text not null,
    target_type text not null,
    target_id text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_space_audit_created on public.space_audit_logs(created_at desc);

-- 8. Storage Bucket for Event Flyers (Private bucket, served via proxy)
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

-- ==============================================================================
-- ATOMIC SECURITY DEFINER FUNCTIONS (Called only by server via service_role)
-- ==============================================================================

-- A. Open Space Walk-in Check-In
create or replace function public.rpc_space_checkin(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
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

    -- If a blocking event is currently live right now, open space is unavailable
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

    -- Audit log
    insert into public.space_audit_logs (actor_id, action, target_type, target_id, metadata)
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
set search_path = public
as $$
declare
    v_now timestamptz := now();
    v_session public.space_sessions%rowtype;
begin
    select * into v_session
    from public.space_sessions
    where id = p_session_id
      and (user_id = p_user_id or p_source = 'admin_forced')
    for update;

    if not found then
        return jsonb_build_object('success', false, 'error', 'Session not found or permission denied.');
    end if;

    if v_session.checked_out_at is not null or v_session.status != 'active' then
        return jsonb_build_object('success', true, 'already_checked_out', true, 'session', row_to_json(v_session));
    end if;

    update public.space_sessions
    set checked_out_at = v_now,
        ended_at = v_now,
        status = 'completed',
        source = p_source
    where id = p_session_id
    returning * into v_session;

    insert into public.space_audit_logs (actor_id, action, target_type, target_id, metadata)
    values (p_user_id::text, 'open_space_checkout', 'space_session', p_session_id::text, jsonb_build_object('source', p_source));

    return jsonb_build_object('success', true, 'session', row_to_json(v_session), 'server_now', v_now);
end;
$$;

-- C. Open Space Session Extension
create or replace function public.rpc_space_extend(p_user_id uuid, p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_settings public.space_settings%rowtype;
    v_now timestamptz := now();
    v_old_session public.space_sessions%rowtype;
    v_occupancy int;
    v_next_event_start timestamptz;
    v_new_expires timestamptz;
    v_new_session public.space_sessions%rowtype;
    v_seconds_to_old_expiry numeric;
begin
    select * into v_settings from public.space_settings where id = 1 for update;
    if not found or not v_settings.is_open or not v_settings.allow_extension then
        return jsonb_build_object('success', false, 'error', 'Session extensions are currently disabled.');
    end if;

    select * into v_old_session from public.space_sessions
    where id = p_session_id and user_id = p_user_id
    for update;

    if not found then
        return jsonb_build_object('success', false, 'error', 'Session not found.');
    end if;

    -- Must be active or recently expired within the extension window
    v_seconds_to_old_expiry := extract(epoch from (v_old_session.expires_at - v_now));
    if v_seconds_to_old_expiry > (v_settings.extension_window_minutes * 60) then
        return jsonb_build_object('success', false, 'error', 'Extensions are only allowed within ' || v_settings.extension_window_minutes || ' minutes of expiration.');
    end if;

    -- Check blocking events
    select min(starts_at) into v_next_event_start
    from public.space_events
    where blocks_open_space = true
      and status in ('published', 'live')
      and deleted_at is null
      and ends_at > v_now
      and starts_at <= (v_now + (v_settings.session_minutes || ' minutes')::interval);

    if exists (
        select 1 from public.space_events
        where blocks_open_space = true and status = 'live' and deleted_at is null and starts_at <= v_now and ends_at > v_now
    ) then
        return jsonb_build_object('success', false, 'error', 'Space is reserved for an event.');
    end if;

    -- Complete old session
    update public.space_sessions
    set status = 'completed', checked_out_at = v_now, ended_at = v_now
    where id = p_session_id;

    -- Calculate new expiry
    v_new_expires := v_now + (v_settings.session_minutes || ' minutes')::interval;
    if v_next_event_start is not null and v_next_event_start < v_new_expires then
        v_new_expires := v_next_event_start;
    end if;

    -- Insert new linked session
    insert into public.space_sessions (
        user_id,
        started_at,
        expires_at,
        status,
        source,
        extension_of
    ) values (
        p_user_id,
        v_now,
        v_new_expires,
        'active',
        'self',
        p_session_id
    )
    returning * into v_new_session;

    insert into public.space_audit_logs (actor_id, action, target_type, target_id, metadata)
    values (p_user_id::text, 'open_space_extend', 'space_session', v_new_session.id::text, jsonb_build_object('previous_session', p_session_id));

    return jsonb_build_object(
        'success', true,
        'session', row_to_json(v_new_session),
        'server_now', v_now
    );
end;
$$;

-- D. Event Registration (Atomic under event lock)
create or replace function public.rpc_space_register_event(p_user_id uuid, p_event_id uuid, p_ticket_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_event public.space_events%rowtype;
    v_now timestamptz := now();
    v_existing public.space_event_registrations%rowtype;
    v_registered_count int;
    v_new_reg public.space_event_registrations%rowtype;
begin
    -- 1. Check existing registration
    select * into v_existing
    from public.space_event_registrations
    where event_id = p_event_id and user_id = p_user_id;

    if found and v_existing.status = 'registered' then
        return jsonb_build_object(
            'success', true,
            'idempotent', true,
            'registration', row_to_json(v_existing)
        );
    end if;

    -- 2. Lock event row for capacity verification
    select * into v_event
    from public.space_events
    where id = p_event_id and deleted_at is null
    for update;

    if not found or v_event.status not in ('published', 'live') then
        return jsonb_build_object('success', false, 'error', 'This event is not open for registration.');
    end if;

    if v_event.registration_opens_at is not null and v_now < v_event.registration_opens_at then
        return jsonb_build_object('success', false, 'error', 'Registration for this event has not opened yet.');
    end if;

    if v_event.registration_closes_at is not null and v_now > v_event.registration_closes_at then
        return jsonb_build_object('success', false, 'error', 'Registration for this event has closed.');
    end if;

    if v_now >= v_event.ends_at then
        return jsonb_build_object('success', false, 'error', 'This event has already ended.');
    end if;

    -- 3. Check capacity under lock
    select count(*) into v_registered_count
    from public.space_event_registrations
    where event_id = p_event_id and status = 'registered';

    if v_registered_count >= v_event.capacity then
        return jsonb_build_object('success', false, 'error', 'Event is sold out (capacity reached).');
    end if;

    -- 4. Insert or reactivate registration
    if found and v_existing.status = 'cancelled' then
        update public.space_event_registrations
        set status = 'registered',
            ticket_code = p_ticket_code,
            registered_at = v_now,
            cancelled_at = null
        where id = v_existing.id
        returning * into v_new_reg;
    else
        insert into public.space_event_registrations (
            event_id,
            user_id,
            status,
            ticket_code,
            registered_at
        ) values (
            p_event_id,
            p_user_id,
            'registered',
            p_ticket_code,
            v_now
        )
        returning * into v_new_reg;
    end if;

    insert into public.space_audit_logs (actor_id, action, target_type, target_id, metadata)
    values (p_user_id::text, 'event_registered', 'event_registration', v_new_reg.id::text, jsonb_build_object('event_id', p_event_id));

    return jsonb_build_object(
        'success', true,
        'idempotent', false,
        'registration', row_to_json(v_new_reg)
    );
end;
$$;

-- E. Event Registration Cancellation
create or replace function public.rpc_space_cancel_registration(p_user_id uuid, p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_reg public.space_event_registrations%rowtype;
    v_now timestamptz := now();
begin
    select * into v_reg
    from public.space_event_registrations
    where event_id = p_event_id and user_id = p_user_id
    for update;

    if not found or v_reg.status = 'cancelled' then
        return jsonb_build_object('success', true, 'already_cancelled', true);
    end if;

    update public.space_event_registrations
    set status = 'cancelled', cancelled_at = v_now
    where id = v_reg.id
    returning * into v_reg;

    insert into public.space_audit_logs (actor_id, action, target_type, target_id, metadata)
    values (p_user_id::text, 'event_registration_cancelled', 'event_registration', v_reg.id::text, jsonb_build_object('event_id', p_event_id));

    return jsonb_build_object('success', true, 'registration', row_to_json(v_reg));
end;
$$;

-- F. Check-In Ticket at Desk (QR or Manual)
create or replace function public.rpc_space_checkin_ticket(
    p_ticket_code text,
    p_expected_event_id uuid,
    p_method text,
    p_scanner_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_reg public.space_event_registrations%rowtype;
    v_event public.space_events%rowtype;
    v_profile public.profiles%rowtype;
    v_settings public.space_settings%rowtype;
    v_now timestamptz := now();
    v_existing_checkin public.space_event_checkins%rowtype;
    v_new_checkin public.space_event_checkins%rowtype;
    v_window_start timestamptz;
    v_window_end timestamptz;
begin
    -- 1. Find registration by ticket code
    select * into v_reg
    from public.space_event_registrations
    where ticket_code = p_ticket_code;

    if not found then
        return jsonb_build_object('success', false, 'code', 'INVALID_TICKET', 'error', 'Invalid ticket code.');
    end if;

    if v_reg.status != 'registered' then
        return jsonb_build_object('success', false, 'code', 'CANCELLED_TICKET', 'error', 'This ticket has been cancelled.');
    end if;

    if v_reg.event_id != p_expected_event_id then
        return jsonb_build_object('success', false, 'code', 'WRONG_EVENT', 'error', 'This ticket is for a different event.');
    end if;

    -- 2. Verify event state
    select * into v_event
    from public.space_events
    where id = p_expected_event_id and deleted_at is null;

    if not found then
        return jsonb_build_object('success', false, 'code', 'EVENT_NOT_FOUND', 'error', 'Event not found.');
    end if;

    if v_event.status != 'live' then
        return jsonb_build_object('success', false, 'code', 'EVENT_NOT_LIVE', 'error', 'Check-in is only allowed while session is set to Live.');
    end if;

    select * into v_settings from public.space_settings where id = 1;
    v_window_start := v_event.starts_at - (coalesce(v_settings.event_checkin_early_minutes, 30) || ' minutes')::interval;
    v_window_end := v_event.ends_at + (coalesce(v_settings.event_checkin_grace_minutes, 30) || ' minutes')::interval;

    if v_now < v_window_start or v_now > v_window_end then
        return jsonb_build_object('success', false, 'code', 'OUTSIDE_WINDOW', 'error', 'Check-in is currently outside the event window.');
    end if;

    -- 3. Check duplicate check-in
    select * into v_existing_checkin
    from public.space_event_checkins
    where registration_id = v_reg.id and revoked_at is null;

    if found then
        return jsonb_build_object(
            'success', false,
            'code', 'ALREADY_CHECKED_IN',
            'error', 'Participant is already checked in.',
            'checked_in_at', v_existing_checkin.checked_in_at,
            'method', v_existing_checkin.method
        );
    end if;

    -- 4. Fetch attendee profile for desk confirmation
    select * into v_profile from public.profiles where id = v_reg.user_id;

    -- 5. Record check-in
    insert into public.space_event_checkins (
        registration_id,
        event_id,
        user_id,
        checked_in_at,
        method,
        checked_in_by
    ) values (
        v_reg.id,
        v_event.id,
        v_reg.user_id,
        v_now,
        p_method,
        p_scanner_id
    )
    returning * into v_new_checkin;

    insert into public.space_audit_logs (actor_id, action, target_type, target_id, metadata)
    values (p_scanner_id::text, 'event_checkin_' || p_method, 'event_checkin', v_new_checkin.id::text, jsonb_build_object(
        'event_id', v_event.id,
        'user_id', v_reg.user_id,
        'username', v_profile.username
    ));

    return jsonb_build_object(
        'success', true,
        'checkin', row_to_json(v_new_checkin),
        'attendee', jsonb_build_object(
            'id', v_reg.user_id,
            'username', v_profile.username,
            'display_name', v_profile.display_name
        )
    );
end;
$$;

-- G. Virtual QR-Free Check-In (Initiated by attendee from ticket page)
create or replace function public.rpc_space_virtual_checkin(p_user_id uuid, p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_reg public.space_event_registrations%rowtype;
    v_event public.space_events%rowtype;
    v_settings public.space_settings%rowtype;
    v_now timestamptz := now();
    v_existing public.space_event_checkins%rowtype;
    v_new_checkin public.space_event_checkins%rowtype;
    v_window_start timestamptz;
    v_window_end timestamptz;
begin
    select * into v_reg
    from public.space_event_registrations
    where event_id = p_event_id and user_id = p_user_id;

    if not found or v_reg.status != 'registered' then
        return jsonb_build_object('success', false, 'error', 'You are not registered for this event.');
    end if;

    select * into v_event
    from public.space_events
    where id = p_event_id and deleted_at is null;

    if not found or v_event.status != 'live' then
        return jsonb_build_object('success', false, 'error', 'Virtual check-in is only available while session is set to Live.');
    end if;

    if not v_event.allow_virtual_checkin then
        return jsonb_build_object('success', false, 'error', 'Organizer has disabled virtual check-in for this session. Please check in via QR desk.');
    end if;

    select * into v_settings from public.space_settings where id = 1;
    v_window_start := v_event.starts_at - (coalesce(v_settings.event_checkin_early_minutes, 30) || ' minutes')::interval;
    v_window_end := v_event.ends_at + (coalesce(v_settings.event_checkin_grace_minutes, 30) || ' minutes')::interval;

    if v_now < v_window_start or v_now > v_window_end then
        return jsonb_build_object('success', false, 'error', 'Check-in is currently outside the event window.');
    end if;

    select * into v_existing
    from public.space_event_checkins
    where registration_id = v_reg.id and revoked_at is null;

    if found then
        return jsonb_build_object('success', true, 'already_checked_in', true, 'checkin', row_to_json(v_existing));
    end if;

    insert into public.space_event_checkins (
        registration_id,
        event_id,
        user_id,
        checked_in_at,
        method,
        checked_in_by
    ) values (
        v_reg.id,
        p_event_id,
        p_user_id,
        v_now,
        'virtual',
        p_user_id
    )
    returning * into v_new_checkin;

    insert into public.space_audit_logs (actor_id, action, target_type, target_id, metadata)
    values (p_user_id::text, 'event_checkin_virtual', 'event_checkin', v_new_checkin.id::text, jsonb_build_object('event_id', p_event_id));

    return jsonb_build_object('success', true, 'checkin', row_to_json(v_new_checkin));
end;
$$;

-- H. Revoke Check-In (Undo)
create or replace function public.rpc_space_revoke_checkin(p_checkin_id uuid, p_revoker_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_checkin public.space_event_checkins%rowtype;
    v_now timestamptz := now();
begin
    select * into v_checkin
    from public.space_event_checkins
    where id = p_checkin_id and revoked_at is null
    for update;

    if not found then
        return jsonb_build_object('success', false, 'error', 'Active check-in not found.');
    end if;

    update public.space_event_checkins
    set revoked_at = v_now, revoked_by = p_revoker_id
    where id = p_checkin_id
    returning * into v_checkin;

    insert into public.space_audit_logs (actor_id, action, target_type, target_id, metadata)
    values (p_revoker_id::text, 'event_checkin_revoked', 'event_checkin', p_checkin_id::text, jsonb_build_object('registration_id', v_checkin.registration_id));

    return jsonb_build_object('success', true, 'checkin', row_to_json(v_checkin));
end;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & GRANTS
-- ==============================================================================

alter table public.space_settings enable row level security;
alter table public.space_sessions enable row level security;
alter table public.space_organizers enable row level security;
alter table public.space_events enable row level security;
alter table public.space_event_registrations enable row level security;
alter table public.space_event_checkins enable row level security;
alter table public.space_audit_logs enable row level security;

-- 1. Space Settings: Read-only to authenticated/anon via secure server API, but public read of safe fields permitted
drop policy if exists "space_settings_read" on public.space_settings;
create policy "space_settings_read" on public.space_settings for select using (true);

-- 2. Space Sessions: Users can select only their own sessions
drop policy if exists "space_sessions_select_own" on public.space_sessions;
create policy "space_sessions_select_own" on public.space_sessions for select to authenticated using (user_id = auth.uid());

-- 3. Space Organizers: Authenticated users can check active organizer status
drop policy if exists "space_organizers_select" on public.space_organizers;
create policy "space_organizers_select" on public.space_organizers for select to authenticated using (true);

-- 4. Space Events: Public can read published/live/completed non-deleted events; Organizers can read their own drafts
drop policy if exists "space_events_public_select" on public.space_events;
create policy "space_events_public_select" on public.space_events for select using (
    deleted_at is null and (
        status in ('published', 'live', 'completed')
        or (auth.uid() is not null and organizer_id = auth.uid())
    )
);

-- 5. Registrations: Users can select only their own registrations; organizers can see registrations for their events
drop policy if exists "space_registrations_select_own" on public.space_event_registrations;
create policy "space_registrations_select_own" on public.space_event_registrations for select to authenticated using (
    user_id = auth.uid()
    or exists (
        select 1 from public.space_events
        where id = event_id and organizer_id = auth.uid() and deleted_at is null
    )
);

-- 6. Check-Ins: Users can select their own check-in; organizers can see check-ins for their events
drop policy if exists "space_checkins_select_own" on public.space_event_checkins;
create policy "space_checkins_select_own" on public.space_event_checkins for select to authenticated using (
    user_id = auth.uid()
    or exists (
        select 1 from public.space_events
        where id = event_id and organizer_id = auth.uid() and deleted_at is null
    )
);

-- 7. Audit logs: Service-role only (no public/authenticated policies)

-- Storage RLS on fole-space-flyers:
drop policy if exists "space_flyers_read" on storage.objects;
create policy "space_flyers_read" on storage.objects for select using (
    bucket_id = 'fole-space-flyers'
);

-- Service role bypasses RLS and has full execution rights on RPCs
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

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
