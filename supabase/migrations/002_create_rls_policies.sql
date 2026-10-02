-- ENGIVAULT Database Migration 002: Row Level Security (RLS) Policies
-- Enforces public read-only access to published curriculum hierarchy, and full access to verified administrators.

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.videos enable row level security;
alter table public.materials enable row level security;
alter table public.uploads enable row level security;
alter table public.activity_logs enable row level security;
alter table public.site_settings enable row level security;

-- Helper function to check if current authenticated user is an admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 1. Profiles Policies
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Admins can update profiles"
  on public.profiles for update
  using (public.is_admin());

-- 2. Subjects Policies
create policy "Public can view published subjects"
  on public.subjects for select
  using (published = true or public.is_admin());

create policy "Admins can insert subjects"
  on public.subjects for insert
  with check (public.is_admin());

create policy "Admins can update subjects"
  on public.subjects for update
  using (public.is_admin());

create policy "Admins can delete subjects"
  on public.subjects for delete
  using (public.is_admin());

-- 3. Modules Policies
create policy "Public can view published modules of published subjects"
  on public.modules for select
  using (
    (published = true and exists (
      select 1 from public.subjects
      where subjects.id = modules.subject_id and subjects.published = true
    ))
    or public.is_admin()
  );

create policy "Admins can insert modules"
  on public.modules for insert
  with check (public.is_admin());

create policy "Admins can update modules"
  on public.modules for update
  using (public.is_admin());

create policy "Admins can delete modules"
  on public.modules for delete
  using (public.is_admin());

-- 4. Lessons Policies
create policy "Public can view published lessons of published modules"
  on public.lessons for select
  using (
    (published = true and exists (
      select 1 from public.modules
      join public.subjects on subjects.id = modules.subject_id
      where modules.id = lessons.module_id and modules.published = true and subjects.published = true
    ))
    or public.is_admin()
  );

create policy "Admins can insert lessons"
  on public.lessons for insert
  with check (public.is_admin());

create policy "Admins can update lessons"
  on public.lessons for update
  using (public.is_admin());

create policy "Admins can delete lessons"
  on public.lessons for delete
  using (public.is_admin());

-- 5. Videos Policies
create policy "Public can view metadata of published videos"
  on public.videos for select
  using (
    (published = true and exists (
      select 1 from public.lessons
      join public.modules on modules.id = lessons.module_id
      join public.subjects on subjects.id = modules.subject_id
      where lessons.id = videos.lesson_id
        and lessons.published = true
        and modules.published = true
        and subjects.published = true
    ))
    or public.is_admin()
  );

create policy "Admins can manage videos"
  on public.videos for all
  using (public.is_admin())
  with check (public.is_admin());

-- 6. Materials Policies
create policy "Public can view metadata of published materials"
  on public.materials for select
  using (
    (published = true and deleted_at is null and exists (
      select 1 from public.lessons
      join public.modules on modules.id = lessons.module_id
      join public.subjects on subjects.id = modules.subject_id
      where lessons.id = materials.lesson_id
        and lessons.published = true
        and modules.published = true
        and subjects.published = true
    ))
    or public.is_admin()
  );

create policy "Admins can manage materials"
  on public.materials for all
  using (public.is_admin())
  with check (public.is_admin());

-- 7. Uploads Policies
create policy "Admins can view and manage uploads"
  on public.uploads for all
  using (public.is_admin())
  with check (public.is_admin());

-- 8. Activity Logs Policies
create policy "Admins can view activity logs"
  on public.activity_logs for select
  using (public.is_admin());

create policy "System can insert activity logs"
  on public.activity_logs for insert
  with check (auth.uid() is not null or public.is_admin());

-- 9. Site Settings Policies
create policy "Public can view site settings"
  on public.site_settings for select
  using (true);

create policy "Admins can update site settings"
  on public.site_settings for update
  using (public.is_admin());
