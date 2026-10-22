-- =============================================================================
-- FOLE STUDENT REGISTRY + LOGIN HISTORY — MANUAL SUPABASE SETUP
-- Run in Supabase Dashboard -> SQL Editor -> New query.
-- This script is idempotent and does not modify Supabase CLI migration history.
-- It links student accounts to public.profiles and records successful sign-ins.
-- It does not store passwords, access tokens, refresh tokens, or IP addresses.
-- =============================================================================

BEGIN;

-- FOLE Student Registry and Login History
-- Reconciles student profiles, ensures profile creation for internal student accounts,
-- hardens DB-backed login throttling, and records successful student sign-ins.
-- Student identities are restricted to the internal students.fole.invalid auth domain.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_lower_username
  ON public.profiles (lower(username));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conname = 'chk_profiles_username_format'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_profiles_username_format
      CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conname = 'chk_profiles_username_reserved'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_profiles_username_reserved
      CHECK (
        username IS NULL OR lower(username) NOT IN (
          'admin', 'administrator', 'fole', 'engivault', 'root',
          'support', 'system', 'mod', 'moderator', 'staff',
          'superuser', 'guest', 'bot'
        )
      );
  END IF;
END
$$;

-- Only internal student Auth identities create student profile rows.
-- Role is hard-coded; user-editable metadata is never trusted for authorization.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  clean_username text;
BEGIN
  IF NEW.email IS NULL
     OR pg_catalog.lower(pg_catalog.split_part(NEW.email, '@', 2)) <> 'students.fole.invalid'
  THEN
    RETURN NEW;
  END IF;

  -- The internal email local-part is the canonical username; do not trust mutable metadata.
  clean_username := pg_catalog.lower(pg_catalog.btrim(pg_catalog.split_part(NEW.email, '@', 1)));

  IF clean_username !~ '^[a-z0-9_]{3,20}$'
     OR clean_username IN (
       'admin', 'administrator', 'fole', 'engivault', 'root',
       'support', 'system', 'mod', 'moderator', 'staff',
       'superuser', 'guest', 'bot'
     )
  THEN
    RAISE EXCEPTION 'Student username is invalid';
  END IF;

  INSERT INTO public.profiles (id, display_name, role, username, created_at, updated_at)
  VALUES (
    NEW.id, clean_username, 'student', clean_username,
    pg_catalog.now(), pg_catalog.now()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'student',
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    display_name = COALESCE(
      NULLIF(pg_catalog.btrim(public.profiles.display_name), ''),
      EXCLUDED.display_name
    ),
    updated_at = pg_catalog.now();

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing internal student accounts whose profile trigger was not installed.
WITH student_accounts AS (
  SELECT
    u.id,
    pg_catalog.lower(
      pg_catalog.btrim(
        pg_catalog.split_part(u.email, '@', 1)
      )
    ) AS username
  FROM auth.users u
  WHERE u.email IS NOT NULL
    AND pg_catalog.lower(pg_catalog.split_part(u.email, '@', 2)) = 'students.fole.invalid'
)
INSERT INTO public.profiles (id, display_name, role, username, created_at, updated_at)
SELECT id, username, 'student', username, pg_catalog.now(), pg_catalog.now()
FROM student_accounts
WHERE username ~ '^[a-z0-9_]{3,20}$'
  AND username NOT IN (
    'admin', 'administrator', 'fole', 'engivault', 'root',
    'support', 'system', 'mod', 'moderator', 'staff',
    'superuser', 'guest', 'bot'
  )
ON CONFLICT (id) DO UPDATE SET
  role = 'student',
  username = COALESCE(public.profiles.username, EXCLUDED.username),
  display_name = COALESCE(NULLIF(pg_catalog.btrim(public.profiles.display_name), ''), EXCLUDED.display_name),
  updated_at = pg_catalog.now();

-- Preserve existing profile isolation; public API roles cannot set usernames/roles directly.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id OR public.is_admin());

-- DB-backed rate limit storage used by student login/sign-up routes.
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1 CHECK (count >= 1),
  window_start timestamptz NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.auth_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.auth_rate_limits TO service_role;

-- Atomic DB-backed limiter, callable only from the trusted server-side service-role client.
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max_attempts integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_now timestamptz := pg_catalog.now();
  v_record public.auth_rate_limits%rowtype;
  v_inserted_key text;
  v_window_end timestamptz;
  v_reset_in integer;
BEGIN
  IF p_key IS NULL OR pg_catalog.length(p_key) = 0
     OR p_window_seconds IS NULL OR p_window_seconds < 1
     OR p_max_attempts IS NULL OR p_max_attempts < 1
  THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;

  INSERT INTO public.auth_rate_limits (key, count, window_start)
  VALUES (p_key, 1, v_now)
  ON CONFLICT (key) DO NOTHING
  RETURNING key INTO v_inserted_key;

  IF v_inserted_key IS NOT NULL THEN
    RETURN pg_catalog.jsonb_build_object(
      'allowed', true,
      'remaining', GREATEST(0, p_max_attempts - 1),
      'reset_in_seconds', p_window_seconds
    );
  END IF;

  SELECT * INTO v_record
  FROM public.auth_rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rate limit state could not be locked';
  END IF;

  v_window_end := v_record.window_start + (p_window_seconds || ' seconds')::interval;

  IF v_window_end <= v_now THEN
    UPDATE public.auth_rate_limits
    SET count = 1, window_start = v_now
    WHERE key = p_key;

    RETURN pg_catalog.jsonb_build_object(
      'allowed', true,
      'remaining', GREATEST(0, p_max_attempts - 1),
      'reset_in_seconds', p_window_seconds
    );
  END IF;

  v_reset_in := GREATEST(
    1,
    pg_catalog.ceil(EXTRACT(EPOCH FROM (v_window_end - v_now)))::integer
  );

  IF v_record.count >= p_max_attempts THEN
    RETURN pg_catalog.jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_in_seconds', v_reset_in
    );
  END IF;

  UPDATE public.auth_rate_limits
  SET count = count + 1
  WHERE key = p_key;

  RETURN pg_catalog.jsonb_build_object(
    'allowed', true,
    'remaining', GREATEST(0, p_max_attempts - (v_record.count + 1)),
    'reset_in_seconds', v_reset_in
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(text, integer, integer)
  TO service_role;

-- Student sign-in history. Username is a snapshot of the registry at login time.
-- Deliberately stores no passwords, access tokens, IP addresses, or refresh tokens.
CREATE TABLE IF NOT EXISTS public.student_login_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  username text NOT NULL,
  login_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  ended_at timestamptz,
  end_reason text CHECK (end_reason IN ('logout', 'new_login')),
  login_source text NOT NULL DEFAULT 'password'
    CHECK (login_source IN ('password', 'signup')),
  CONSTRAINT chk_student_login_session_end
    CHECK (ended_at IS NULL OR ended_at >= login_at),
  CONSTRAINT chk_student_login_session_end_reason
    CHECK ((ended_at IS NULL AND end_reason IS NULL) OR (ended_at IS NOT NULL AND end_reason IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_student_login_sessions_login_at
  ON public.student_login_sessions (login_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_login_sessions_user_login_at
  ON public.student_login_sessions (user_id, login_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_login_sessions_lower_username
  ON public.student_login_sessions (lower(username));

ALTER TABLE public.student_login_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.student_login_sessions FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.student_login_sessions TO service_role;

-- This installer deliberately does not write to supabase_migrations.schema_migrations.


COMMIT;
NOTIFY pgrst, 'reload schema';

-- Verification: choose "No limit" in the SQL Editor if it appends a LIMIT to scripts.
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username'
    )
    AND EXISTS (
      SELECT 1 FROM pg_catalog.pg_trigger t
      JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'auth' AND c.relname = 'users'
        AND t.tgname = 'on_auth_user_created' AND NOT t.tgisinternal
    )
    AND EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'check_and_increment_rate_limit'
        AND pg_catalog.has_function_privilege('service_role', p.oid, 'EXECUTE')
        AND NOT pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE')
        AND NOT pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE')
    )
    AND EXISTS (
      SELECT 1 FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'student_login_sessions'
        AND c.relrowsecurity
    )
    AND EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'space_organizers'
    )
    AND NOT EXISTS (
      SELECT 1 FROM auth.users u
      LEFT JOIN public.profiles p ON p.id = u.id
      WHERE u.email IS NOT NULL
        AND pg_catalog.lower(pg_catalog.split_part(u.email, '@', 2)) = 'students.fole.invalid'
        AND p.id IS NULL
    )
    THEN 'ALL_CHECKS_PASSED'
    ELSE 'CHECKS_NEED_ATTENTION'
  END AS overall_status,
  (SELECT count(*) FROM public.profiles WHERE role = 'student') AS registered_students,
  (SELECT count(*) FROM public.student_login_sessions) AS recorded_login_sessions;

-- If "ALL_CHECKS_PASSED", future student signups create linked profile rows,
-- successful logins append a login-history row, and logout closes that row.
