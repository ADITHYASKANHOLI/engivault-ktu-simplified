-- ENGIVAULT Database Migration 014: Video & Lecture Drag-and-Drop Reordering Engine
--
-- Capabilities:
-- 1. Dedicated display_order fields on public.lessons and public.videos.
-- 2. Performance indexes for fast sorted curriculum traversal by module and display_order.
-- 3. Atomic, transactional PostgreSQL RPC function rpc_reorder_lessons with strict administrator validation.
-- 4. Search path lockdown and role-based execution privilege enforcement.

-- ------------------------------------------------------------------------------
-- 1. Ensure display_order exists on lessons and videos
-- ------------------------------------------------------------------------------
alter table public.lessons
add column if not exists display_order integer not null default 0;

alter table public.videos
add column if not exists display_order integer not null default 0;

-- Indexes for lightning-fast ordered queries
create index if not exists idx_lessons_module_display_order
on public.lessons (module_id, display_order, lesson_number);

create index if not exists idx_videos_display_order
on public.videos (display_order, created_at);

-- ------------------------------------------------------------------------------
-- 2. Initial deterministic order normalization
-- ------------------------------------------------------------------------------
-- Ensure any legacy lessons without display_order receive sequential numbers
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
set
  display_order = ol.seq,
  lesson_number = coalesce(l.lesson_number, ol.seq)
from ordered_lessons ol
where l.id = ol.id
  and (l.display_order is null or l.display_order = 0);

-- ------------------------------------------------------------------------------
-- 3. Atomic Transactional RPC: rpc_reorder_lessons
-- ------------------------------------------------------------------------------
create or replace function public.rpc_reorder_lessons(p_orders jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
  v_item jsonb;
  v_lesson_id uuid;
  v_target_order int;
  v_seq int := 1;
  v_module_id uuid := null;
  v_current_module_id uuid;
  v_count int;
  v_updated jsonb := '[]'::jsonb;
begin
  -- 1. Security Check: Require admin role or service_role
  if not public.is_admin() and current_user not in ('service_role', 'postgres') then
    raise exception 'Unauthorized: Administrator privileges required to reorder lessons.';
  end if;

  -- 2. Validate input array
  if p_orders is null or jsonb_typeof(p_orders) <> 'array' or jsonb_array_length(p_orders) = 0 then
    raise exception 'Invalid payload: p_orders must be a non-empty JSON array.';
  end if;

  v_count := jsonb_array_length(p_orders);
  if v_count > 500 then
    raise exception 'Payload limit exceeded: Maximum 500 lessons can be reordered at once.';
  end if;

  -- 3. First pass: Verify all IDs exist and belong to the same module (prevent cross-module corruption)
  for v_item in select * from jsonb_array_elements(p_orders)
  loop
    -- Support both string UUID format: ["id1", "id2"] and object format: [{"id": "id1"}, ...]
    if jsonb_typeof(v_item) = 'string' then
      v_lesson_id := (v_item #>> '{}')::uuid;
    elsif jsonb_typeof(v_item) = 'object' and v_item ? 'id' then
      v_lesson_id := (v_item ->> 'id')::uuid;
    else
      raise exception 'Invalid item format in reorder payload.';
    end if;

    select module_id into v_current_module_id
    from public.lessons
    where id = v_lesson_id;

    if not found then
      raise exception 'Lesson not found: %', v_lesson_id;
    end if;

    if v_module_id is null then
      v_module_id := v_current_module_id;
    elsif v_module_id <> v_current_module_id then
      raise exception 'Cross-module reordering prohibited: All lessons must belong to the same module.';
    end if;
  end loop;

  -- 4. Second pass: Atomically assign sequential continuous ordering (1, 2, 3... N)
  for v_item in select * from jsonb_array_elements(p_orders)
  loop
    if jsonb_typeof(v_item) = 'string' then
      v_lesson_id := (v_item #>> '{}')::uuid;
    else
      v_lesson_id := (v_item ->> 'id')::uuid;
    end if;

    update public.lessons
    set
      display_order = v_seq,
      lesson_number = v_seq,
      updated_at = now()
    where id = v_lesson_id;

    v_updated := v_updated || jsonb_build_object(
      'id', v_lesson_id,
      'display_order', v_seq,
      'lesson_number', v_seq
    );

    v_seq := v_seq + 1;
  end loop;

  return jsonb_build_object(
    'success', true,
    'module_id', v_module_id,
    'count', v_count,
    'items', v_updated
  );
end;
$$;

-- Secure execution permissions: Revoke from public, grant to authenticated and service_role
revoke all on function public.rpc_reorder_lessons(jsonb) from public;
grant execute on function public.rpc_reorder_lessons(jsonb) to authenticated, service_role;

-- Notify PostgREST to reload schema
notify pgrst, 'reload schema';
