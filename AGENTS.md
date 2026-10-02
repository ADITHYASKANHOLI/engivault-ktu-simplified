# ENGIVAULT Architectural Rules & Conventions

## 1. Core Principles
- **Inspect Before Modifying:** Always inspect existing components, schemas, queries, and routes before introducing changes.
- **Academic Source of Truth:** EngiVault is an academic digital vault for engineering students. The central content unit is the **Lecture**.
- **Hierarchy:** `Department / Branch` → `Semester / Year` → `Subject` → `Module / Unit` → `Topic` → `Lecture` → `Watch / Learn`.
- **YouTube-First Delivery:** All new lectures are powered by validated YouTube embeds. Never require large raw video file uploads for lectures.
- **Never Accept Arbitrary Iframes:** Only extract validated YouTube video IDs via `lib/utils/youtube.ts`. Always generate canonical embed URLs from the sanitized ID.
- **Strict Role Separation:** 
  - Students must never see admin controls or routes.
  - All admin mutations (`/api/admin/*`) must enforce server-side authentication and authorization.

## 2. YouTube Parsing & Embedding Rules
- Always use the shared utility in `lib/utils/youtube.ts`.
- Whitelisted domains: `youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`.
- Supported formats: watch URLs (`v=...`), short URLs (`youtu.be/...`), Shorts (`shorts/...`), embed URLs (`embed/...`).
- Store both `youtube_url` and `youtube_video_id` in database records.
- Standard thumbnail pattern: `https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg`. Provide graceful image fallbacks.
- Embed player must maintain a 16:9 responsive aspect ratio.

## 3. Database & Query Layer
- **Dual-Mode Data Source:**
  - Production: Supabase PostgreSQL with Row Level Security (RLS).
  - Development / Zero-Config: File-backed store (`.engivault-local-store.json`) activated when Supabase credentials are absent or placeholder.
- **Backward Compatibility:**
  - Never destructively delete legacy fields (`video_id`, storage paths, MP4 references).
  - If a legacy video exists without a YouTube URL, render the legacy HTML5 player gracefully.

## 4. Git & GitHub Repository Rules
- Repository name is strictly: `ENGIVAULT02`.
- Canonical branch: `main`.
- Never commit `.env*` or secret credentials.
- Use descriptive conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
- Maintain continuous Git history across all sessions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
