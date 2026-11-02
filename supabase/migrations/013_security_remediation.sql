-- ==============================================================================
-- Migration 013: Security Remediation & Access Control Hardening
--
-- Remediations Applied:
-- 1. [BOLA / IDOR] rpc_space_checkout: Enforce user_id ownership check on self checkouts.
-- 2. [Search Path Hijacking] public.is_admin(): Fixed search_path = public, pg_temp
--    and isolated backend helper in app_private schema with public facade.
-- 3. [Search Path Hijacking] public.handle_updated_at(): Fixed search_path = public, pg_temp.
-- 4. [Audit Log Tampering] public.activity_logs: Revoke public/client insert/mutation privileges.
--    Drop "System can insert activity logs" policy so authenticated users cannot inject logs.
--    Restrict insertions strictly to server-side service_role.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BOLA / IDOR Fix: Harden rpc_space_checkout
-- ------------------------------------------------------------------------------
create or replace function public.rpc_space_checkout(
    p_user_id uuid,
    p_session_id uuid,
    p_source text default 'self'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_session public.space_sessions%rowtype;
    v_now timestamptz := now();
begin
    -- Strict ownership boundary: 'self' source checkouts MUST match user_id
    if coalesce(p_source, 'self') = 'self' then
        select * into v_session
        from public.space_sessions
        where id = p_session_id
          and user_id = p_user_id
        for update;
    elsif p_source = 'admin_forced' then
        select * into v_session
        from public.space_sessions
        where id = p_session_id
        for update;
    else
        return jsonb_build_object('success', false, 'error', 'Invalid check-out source specified.');
    end if;

    if not found then
        return jsonb_build_object('success', false, 'error', 'Active session not found or unauthorized.');
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

    -- Audit log record
    insert into public.space_audit_log (actor_id, action, target_type, target_id, metadata)
    values (
        coalesce(p_user_id::text, 'admin'),
        'open_space_checkout',
        'space_session',
        p_session_id::text,
        jsonb_build_object(
            'source', p_source,
            'duration_seconds', extract(epoch from (v_now - v_session.started_at))
        )
    );

    return jsonb_build_object('success', true, 'session', row_to_json(v_session));
end;
$$;

revoke all on function public.rpc_space_checkout(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.rpc_space_checkout(uuid, uuid, text) to service_role;

-- ------------------------------------------------------------------------------
-- 2. Search Path & Schema Isolation: Harden is_admin()
-- ------------------------------------------------------------------------------
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to service_role, authenticated, anon;

create or replace function app_private.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;

revoke all on function app_private.is_admin() from public;
grant execute on function app_private.is_admin() to anon, authenticated, service_role;

-- Public facade function to preserve compatibility with all existing RLS policies
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
begin
  return app_private.is_admin();
end;
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. Search Path Hijacking Fix: Harden public.handle_updated_at()
-- ------------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------------------------
-- 4. Audit Log Tampering Fix: public.activity_logs
-- ------------------------------------------------------------------------------
-- Drop insecure insert policy that allowed any authenticated student to forge logs
drop policy if exists "System can insert activity logs" on public.activity_logs;

-- Explicitly revoke table mutation privileges from client-facing roles
revoke insert, update, delete on public.activity_logs from public, anon, authenticated;

-- Ensure select remains restricted to verified admins via RLS
-- (Admins can view activity logs policy from migration 002 remains active)
grant select on public.activity_logs to authenticated;
grant all on public.activity_logs to service_role;

-- ------------------------------------------------------------------------------
-- 5. Refresh PostgREST schema cache
-- ------------------------------------------------------------------------------
notify pgrst, 'reload schema';
