-- ============================================================================
-- Migration 009: FOLE WORKS Security Grants and Schema Cache Refresh
-- Ensures public read grants for anon/authenticated roles and reloads PostgREST cache.
-- ============================================================================

-- 1. Ensure public schema usage for anon and authenticated roles
grant usage on schema public to anon, authenticated;

-- 2. Explicit table-level SELECT grant on works_activities
-- This ensures PostgREST allows public reads subject to Row Level Security (RLS) policies.
grant select on public.works_activities to anon, authenticated;

-- 3. Full permissions for service_role administrative operations
grant all on public.works_activities to service_role;

-- 4. Re-affirm Row Level Security on works_activities
alter table public.works_activities enable row level security;

-- 5. Refresh the Supabase / PostgREST schema cache
notify pgrst, 'reload schema';
