-- ENGIVAULT Database Migration 001: Initial Schema
-- Sets up core tables, relationships, constraints, and indexes.

-- 1. Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'student' check (role in ('admin', 'student')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Subjects
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  code text,
  short_description text,
  description text,
  thumbnail_path text,
  published boolean not null default false,
  display_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Modules
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  slug text not null,
  short_description text,
  display_order integer not null default 0,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_subject_module_slug unique (subject_id, slug)
);

-- 4. Lessons
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  slug text not null,
  lesson_number integer,
  description text,
  thumbnail_path text,
  duration_seconds integer,
  published boolean not null default false,
  display_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_module_lesson_slug unique (module_id, slug)
);

-- 5. Videos
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid unique not null references public.lessons(id) on delete cascade,
  title text,
  storage_path text not null,
  mime_type text not null,
  file_size bigint,
  thumbnail_path text,
  duration_seconds integer,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Materials
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  module_id uuid references public.modules(id) on delete set null,
  title text not null,
  description text,
  material_type text not null default 'pdf',
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  file_size bigint,
  published boolean not null default false,
  display_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 7. Uploads Tracking
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  storage_path text,
  original_filename text,
  mime_type text,
  file_size bigint,
  status text not null default 'pending' check (status in ('pending','uploading','completed','failed','deleted')),
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- 8. Activity Logs
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 9. Site Settings
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null default 'ENGIVAULT',
  headline text default 'Learn Engineering. Build Confidence.',
  tagline text default 'KTU Learning. Simplified.',
  logo_path text,
  contact_email text default 'contact@engivault.edu',
  about_text text,
  footer_text text default '© 2026 ENGIVAULT. All rights reserved. KTU Engineering Education.',
  social_links jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_subjects_slug on public.subjects (slug);
create index if not exists idx_subjects_published_order on public.subjects (published, display_order);
create index if not exists idx_modules_subject_order on public.modules (subject_id, published, display_order);
create index if not exists idx_lessons_module_order on public.lessons (module_id, published, display_order);
create index if not exists idx_materials_lesson_order on public.materials (lesson_id, published, display_order);
create index if not exists idx_materials_subject on public.materials (subject_id, published);
create index if not exists idx_activity_logs_created on public.activity_logs (actor_id, created_at desc);
create index if not exists idx_uploads_created on public.uploads (created_by, created_at desc);

-- Function to handle updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger trg_subjects_updated_at before update on public.subjects for each row execute procedure public.handle_updated_at();
create trigger trg_modules_updated_at before update on public.modules for each row execute procedure public.handle_updated_at();
create trigger trg_lessons_updated_at before update on public.lessons for each row execute procedure public.handle_updated_at();
create trigger trg_videos_updated_at before update on public.videos for each row execute procedure public.handle_updated_at();
create trigger trg_materials_updated_at before update on public.materials for each row execute procedure public.handle_updated_at();
create trigger trg_site_settings_updated_at before update on public.site_settings for each row execute procedure public.handle_updated_at();
