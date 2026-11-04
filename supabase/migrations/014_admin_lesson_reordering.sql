-- ENGIVAULT Database Migration 014: Admin Lesson & Video Drag-and-Drop Reordering Engine
--
-- Capabilities:
-- 1. Ensure display_order column exists on public.lessons and public.videos.
-- 2. Performance indexes on (module_id, display_order, lesson_number) and (display_order, created_at).
-- 3. Dedicated atomic PostgreSQL RPC function rpc_reorder_module_lessons(p_module_id uuid, p_ordered_ids uuid[])
--    - Locks the target module row using SELECT ... FOR UPDATE to serialize concurrent updates.
--    - Validates that submitted IDs match all lessons in the target module.
--    - Strictly checks that all lessons belong to the specified module.
--    - Rejects duplicate IDs and mismatched counts.
--    - Temporarily assigns negative offset positions to avoid unique or ordering conflicts.
--    - Assigns contiguous positive positions (1, 2, 3... N) to display_order.
--    - Preserves existing lesson_number, created_at, video URLs, and metadata intact.
--    - Returns the updated lessons in order.
-- 4. Security:
--    - SECURITY DEFINER with fixed search_path = public, app_private, pg_temp.
--    - Execution revoked from PUBLIC, anon, authenticated.
--    - Execution granted ONLY to service_role.

-- ------------------------------------------------------------------------------
-- 1. Ensure display_order exists on lessons and videos
-- ------------------------------------------------------------------------------
alter table public.lessons
add column if not exists display_order integer not null default 0;

alter table public.videos
add column if not exists display_order integer not null default 0;

-- ------------------------------------------------------------------------------
-- 2. Create performance indexes
-- ------------------------------------------------------------------------------
create index if not exists idx_lessons_module_display_order
on public.lessons (module_id, display_order, lesson_number);

create index if not exists idx_videos_display_order
on public.videos (display_order, created_at);

-- ------------------------------------------------------------------------------
-- 3. Initial deterministic display_order normalization for existing lessons
-- ------------------------------------------------------------------------------
with ordered_lessons as (
  select
    id,
    row_number() over (
      partition by module_id
      order by
        coalesce(nullif(display_order, 0), lesson_number, 999999),
        created_at asc
    ) as seq
  from public.lessons
)
update public.lessons l
set display_order = ol.seq
from ordered_lessons ol
where l.id = ol.id
  and (l.display_order is null or l.display_order = 0);

-- ------------------------------------------------------------------------------
-- 4. Dedicated PostgreSQL RPC function for atomic module lesson reordering
-- ------------------------------------------------------------------------------
create or replace function public.rpc_reorder_module_lessons(
  p_module_id uuid,
  p_ordered_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
  v_total_lessons int;
  v_submitted_count int;
  v_distinct_count int;
  v_mismatched_count int;
  v_seq int := 1;
  v_lesson_id uuid;
  v_updated jsonb := '[]'::jsonb;
begin
  -- 1. Lock the target module row to serialize concurrent reorders
  perform 1
  from public.modules
  where id = p_module_id
  for update;

  if not found then
    raise exception 'Module not found: %', p_module_id;
  end if;

  -- 2. Validate submitted array
  if p_ordered_ids is null or array_length(p_ordered_ids, 1) is null or array_length(p_ordered_ids, 1) = 0 then
    raise exception 'Ordered IDs array cannot be null or empty.';
  end if;

  v_submitted_count := array_length(p_ordered_ids, 1);
  if v_submitted_count > 500 then
    raise exception 'Payload limit exceeded: Maximum 500 lessons can be reordered at once.';
  end if;

  -- Check for duplicate IDs in submitted array
  select count(distinct id) into v_distinct_count
  from unnest(p_ordered_ids) as id;

  if v_distinct_count <> v_submitted_count then
    raise exception 'Duplicate lesson IDs detected in reorder sequence.';
  end if;

  -- Verify total lessons count in the module matches submitted count
  select count(*) into v_total_lessons
  from public.lessons
  where module_id = p_module_id;

  if v_total_lessons <> v_submitted_count then
    raise exception 'Reorder sequence must contain every existing lesson in module % exactly once. Expected % lessons, got %.',
      p_module_id, v_total_lessons, v_submitted_count;
  end if;

  -- Verify all submitted IDs belong to this module
  select count(*) into v_mismatched_count
  from unnest(p_ordered_ids) as sid
  where not exists (
    select 1 from public.lessons l
    where l.id = sid and l.module_id = p_module_id
  );

  if v_mismatched_count > 0 then
    raise exception 'Cross-module reordering prohibited: % submitted lesson IDs do not belong to module %.',
      v_mismatched_count, p_module_id;
  end if;

  -- 3. Temporarily assign non-conflicting negative positions
  update public.lessons
  set display_order = -display_order - 1000
  where module_id = p_module_id;

  -- 4. Assign contiguous positive positions (1, 2, 3... N)
  -- IMPORTANT: Preserve lesson_number, created_at, video metadata unchanged!
  for v_seq in 1..v_submitted_count
  loop
    v_lesson_id := p_ordered_ids[v_seq];

    update public.lessons
    set
      display_order = v_seq,
      updated_at = now()
    where id = v_lesson_id;

    v_updated := v_updated || jsonb_build_object(
      'id', v_lesson_id,
      'display_order', v_seq
    );
  end loop;

  return jsonb_build_object(
    'success', true,
    'module_id', p_module_id,
    'count', v_submitted_count,
    'items', v_updated
  );
end;
$$;

-- ------------------------------------------------------------------------------
-- 5. Backwards-compatible JSONB overload: rpc_reorder_lessons(jsonb)
-- ------------------------------------------------------------------------------
create or replace function public.rpc_reorder_lessons(p_orders jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
  v_module_id uuid;
  v_item jsonb;
  v_ids uuid[] := array[]::uuid[];
  v_lesson_id uuid;
begin
  if p_orders is null or jsonb_typeof(p_orders) <> 'array' or jsonb_array_length(p_orders) = 0 then
    raise exception 'p_orders must be a non-empty JSON array.';
  end if;

  for v_item in select * from jsonb_array_elements(p_orders)
  loop
    if jsonb_typeof(v_item) = 'string' then
      v_lesson_id := (v_item #>> '{}')::uuid;
    elsif jsonb_typeof(v_item) = 'object' and v_item ? 'id' then
      v_lesson_id := (v_item ->> 'id')::uuid;
    else
      raise exception 'Invalid item format in reorder payload.';
    end if;

    v_ids := array_append(v_ids, v_lesson_id);

    if v_module_id is null then
      select module_id into v_module_id from public.lessons where id = v_lesson_id;
    end if;
  end loop;

  return public.rpc_reorder_module_lessons(v_module_id, v_ids);
end;
$$;

-- ------------------------------------------------------------------------------
-- 6. Strict Role-Based Execution Permissions
-- ------------------------------------------------------------------------------
-- Revoke execution from PUBLIC, anon, and authenticated
revoke all on function public.rpc_reorder_module_lessons(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.rpc_reorder_lessons(jsonb) from public, anon, authenticated;

-- Grant execution ONLY to service_role (invoked via server-side admin client)
grant execute on function public.rpc_reorder_module_lessons(uuid, uuid[]) to service_role;
grant execute on function public.rpc_reorder_lessons(jsonb) to service_role;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
