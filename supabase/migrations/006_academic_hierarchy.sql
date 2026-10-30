-- ENGIVAULT Database Migration 006: Complete Academic Hierarchy
-- Introduces Departments, Semesters, Topics, and Faculty tables to support the
-- 6-tier hierarchy: Department -> Semester -> Subject -> Module -> Topic -> Lecture

-- 1. Departments / Branches
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  slug text unique not null,
  description text,
  display_order integer not null default 0,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Semesters / Academic Years
create table if not exists public.semesters (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete cascade,
  number integer not null check (number between 1 and 8),
  title text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Faculty / Instructors
create table if not exists public.faculty (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  department text,
  email text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Topics within Modules
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  display_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_module_topic_slug unique (module_id, slug)
);

-- 5. Link Subjects to Department and Semester
alter table public.subjects
add column if not exists department_id uuid references public.departments(id) on delete set null,
add column if not exists semester_id uuid references public.semesters(id) on delete set null,
add column if not exists semester_number integer;

-- 6. Link Lessons (Lectures) to Topics and Faculty
alter table public.lessons
add column if not exists topic_id uuid references public.topics(id) on delete set null,
add column if not exists faculty_id uuid references public.faculty(id) on delete set null,
add column if not exists instructor text,
add column if not exists status text default 'published' check (status in ('published', 'draft', 'archived'));

-- Indexes for fast hierarchical traversal
create index if not exists idx_departments_slug on public.departments (slug);
create index if not exists idx_semesters_number on public.semesters (number);
create index if not exists idx_subjects_department_semester on public.subjects (department_id, semester_id);
create index if not exists idx_topics_module on public.topics (module_id, display_order);
create index if not exists idx_lessons_topic on public.lessons (topic_id);
create index if not exists idx_lessons_faculty on public.lessons (faculty_id);
