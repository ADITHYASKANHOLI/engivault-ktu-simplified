-- ============================================================================
-- Migration 008: FOLE WORKS Operational & Professional Activities Table and RLS
-- ============================================================================

-- 1. Create works_activities table
create table if not exists public.works_activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  description text not null,
  category text not null,
  activity_type text not null,
  delivery_mode text not null default 'in_person' check (delivery_mode in ('in_person', 'online', 'hybrid')),
  venue text,
  cover_image text,
  start_at timestamptz,
  end_at timestamptz,
  timezone text not null default 'Asia/Kolkata',
  organizer_details text,
  learning_outcomes jsonb not null default '[]'::jsonb,
  registration_url text,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  fee_amount numeric not null default 0 check (fee_amount >= 0),
  currency text not null default 'INR',
  capacity integer check (capacity is null or capacity > 0),
  contact_email text,
  contact_phone text,
  supporting_resources jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz
);

-- 2. Indexes for fast filtering, catalog retrieval, and slug lookup
create index if not exists idx_works_activities_slug on public.works_activities (slug);
create index if not exists idx_works_activities_status on public.works_activities (status);
create index if not exists idx_works_activities_category on public.works_activities (category);
create index if not exists idx_works_activities_delivery_mode on public.works_activities (delivery_mode);
create index if not exists idx_works_activities_start_at on public.works_activities (start_at);
create index if not exists idx_works_activities_deleted_at on public.works_activities (deleted_at);
create index if not exists idx_works_activities_is_featured on public.works_activities (is_featured);

-- 3. Row Level Security (RLS)
alter table public.works_activities enable row level security;

-- Public can view published, non-deleted activities
create policy "Public can view published works activities"
  on public.works_activities for select
  using (
    (status = 'published' and deleted_at is null)
    or public.is_admin()
  );

-- Admins can insert activities
create policy "Admins can insert works activities"
  on public.works_activities for insert
  with check (public.is_admin());

-- Admins can update activities
create policy "Admins can update works activities"
  on public.works_activities for update
  using (public.is_admin());

-- Admins can delete activities
create policy "Admins can delete works activities"
  on public.works_activities for delete
  using (public.is_admin());
