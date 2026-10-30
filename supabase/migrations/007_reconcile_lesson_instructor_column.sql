-- ENGIVAULT Database Migration 007: Reconcile lessons instructor column
-- Safe for databases where the column already exists.
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS instructor text;

-- Refresh the Supabase/PostgREST schema cache.
NOTIFY pgrst, 'reload schema';
