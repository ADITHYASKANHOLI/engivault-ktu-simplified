-- ENGIVAULT Database Migration 003: Storage Buckets & Policies
-- Configures storage buckets for videos, materials, thumbnails, and branding.

-- Insert buckets into storage.buckets if they do not exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('engivault-videos', 'engivault-videos', false, 5368709120, array['video/mp4', 'video/webm', 'video/quicktime']), -- 5GB limit
  ('engivault-materials', 'engivault-materials', false, 104857600, array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip', 'application/x-zip-compressed']), -- 100MB limit
  ('engivault-thumbnails', 'engivault-thumbnails', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']), -- 10MB limit
  ('engivault-branding', 'engivault-branding', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage Policies for Videos (Private - accessed via signed URLs or admin)
create policy "Admins can upload videos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'engivault-videos' and public.is_admin());

create policy "Admins can update and delete videos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'engivault-videos' and public.is_admin());

create policy "Admins can delete videos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'engivault-videos' and public.is_admin());

-- Storage Policies for Materials (Private - accessed via signed URLs or admin)
create policy "Admins can upload materials"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'engivault-materials' and public.is_admin());

create policy "Admins can manage materials"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'engivault-materials' and public.is_admin())
  with check (bucket_id = 'engivault-materials' and public.is_admin());

-- Storage Policies for Thumbnails & Branding (Public read, admin write)
create policy "Public can view thumbnails"
  on storage.objects for select
  using (bucket_id in ('engivault-thumbnails', 'engivault-branding'));

create policy "Admins can upload thumbnails and branding"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('engivault-thumbnails', 'engivault-branding') and public.is_admin());

create policy "Admins can update and delete thumbnails and branding"
  on storage.objects for all
  to authenticated
  using (bucket_id in ('engivault-thumbnails', 'engivault-branding') and public.is_admin())
  with check (bucket_id in ('engivault-thumbnails', 'engivault-branding') and public.is_admin());
