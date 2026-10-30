-- ENGIVAULT Database Migration 005: Add YouTube fields to lessons
-- Replaces direct video-file upload requirement with YouTube video integration for lectures.

alter table public.lessons
add column if not exists youtube_url text,
add column if not exists youtube_video_id text;

-- Index on youtube_video_id for fast lookup
create index if not exists idx_lessons_youtube_video_id on public.lessons (youtube_video_id);
