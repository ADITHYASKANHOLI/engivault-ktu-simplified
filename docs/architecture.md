# ENGIVAULT — Architecture & System Design

**Platform:** ENGIVAULT  
**Tagline:** KTU Learning. Simplified.  
**Frontend / App Layer:** Next.js 16.4 (App Router, Turbopack, React 19, Tailwind CSS v4)  
**Edge Routing & Proxy:** Next.js 16 `proxy.ts` (lightweight edge gate)  
**Backend / Database:** Supabase PostgreSQL with Row Level Security (RLS)  
**Storage:** Supabase Storage (Private Video & Material Buckets, Public Thumbnails & Branding)  
**Hosting Target:** Vercel Serverless (Next.js Application) + Supabase (Managed Cloud PostgreSQL & Storage)  
**Primary Repository:** GitHub `engivault-ktu-simplified` (canonical branch: `main`)  

---

## 1. High-Level System Architecture

```text
       ┌──────────────────────────┐      ┌──────────────────────────┐      ┌──────────────────────────┐
       │      PUBLIC GUESTS       │      │  AUTHENTICATED STUDENTS  │      │     ADMIN OPERATORS      │
       │  Zero Friction Browsing  │      │  Self-Service Accounts   │      │   Access Code Console    │
       └────────────┬─────────────┘      └────────────┬─────────────┘      └────────────┬─────────────┘
                    │                                 │                                 │
                    │ HTTPS (Read-Only)               │ HTTPS (Supabase Auth SSR Cookie)│ HTTPS (HMAC Signed Cookie)
                    ▼                                 ▼                                 ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   NEXT.JS 16 APPLICATION LAYER                                         │
│                                                                                                        │
│  ┌─────────────────────────┐   ┌──────────────────────────┐   ┌─────────────────────────────────────┐  │
│  │   Public App Router     │   │  Student Hub & Features  │   │       Admin Management Shell        │  │
│  │  - / (Homepage)         │   │  - /account (Profile/PW) │   │  - /admin/dashboard                 │  │
│  │  - /subjects/*          │   │  - LoginDialog (Modal)   │   │  - /admin/dashboard/students        │  │
│  │  - /lectures            │   │  - AuthMenu (SiteHeader) │   │  - /admin/dashboard/lessons         │  │
│  │  - /materials           │   │                          │   │  - /admin/dashboard/works/*         │  │
│  │  - /fole-works/*        │   │                          │   │  - /admin/login (Fallback)          │  │
│  └───────────┬─────────────┘   └────────────┬─────────────┘   └──────────────────┬──────────────────┘  │
│              │                              │                                    │                     │
│              ▼                              ▼                                    ▼                     │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              SERVERLESS ROUTE HANDLERS (runtime = "nodejs")                      │  │
│  │  • /api/auth/student/signup  • /api/auth/student/login  • /api/auth/student/change-password     │  │
│  │  • /api/admin/login          • /api/admin/students      • /api/admin/lessons / works / etc.      │  │
│  │  • /api/health               • /api/contact             • /api/materials/download                │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────────────────────┘  │
│                                             │                                                          │
│                                             ▼                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                DATA & SECURITY ACCESS LAYER                                      │  │
│  │  • Dual-Mode Data Access: Live Supabase PostgreSQL vs Local Dev JSON fallback                    │  │
│  │  • DB-Backed Sliding Window Rate Limiting (auth_rate_limits table + atomic RPC)                  │  │
│  │  • Same-Origin CSRF Verification & Open-Redirect Sanitization                                    │  │
│  │  • Cache Invalidation Layer (lib/cache/revalidate.ts)                                            │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────┼──────────────────────────────────────────────────────────┘
                                              │
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       SUPABASE CLOUD PLATFORM                                          │
│                                                                                                        │
│  ┌────────────────────────────────────────────────────┐  ┌──────────────────────────────────────────┐  │
│  │                PostgreSQL Database                 │  │             Supabase Storage             │  │
│  │  - profiles (id references auth.users, username)   │  │  - engivault-materials (Private 100M)    │  │
│  │  - auth_rate_limits (IP/user atomic sliding window)│  │  - engivault-videos (Legacy MP4)         │  │
│  │  - subjects, modules, topics, lessons              │  │  - engivault-thumbnails (Public 10M)     │  │
│  │  - works_activities (Community workshops/flyers)  │  │  - engivault-branding (Public 10M)       │  │
│  │  - materials (PDF notes & syllabus metadata)       │  │                                          │  │
│  │  - activity_logs (Audit trail for mutations)       │  │                                          │  │
│  └────────────────────────────────────────────────────┘  └──────────────────────────────────────────┘  │
│                                                                                                        │
│  Row Level Security (RLS) Policies:                                                                    │
│  - Public anon key: SELECT only where published = true AND parent entities are published.              │
│  - Student authenticated key: SELECT own profile; writes to role/username strictly prohibited.         │
│  - Admin service role key: Server-only full read/write, never exposed to client browser.              │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Content Synchronization and CRUD

### 2.1 Supabase as the Single Source of Truth
The central tenet of ENGIVAULT's data architecture is that **Supabase PostgreSQL is the authoritative, immutable source of truth** for all curriculum records, user identities, and media references:
- **Subjects**, **Modules**, **Lessons**, **Videos**, **Materials**, and **Profiles** are stored in relational tables with foreign key constraints.
- No client-side `localStorage`, `sessionStorage`, static mock arrays, or in-memory caches hold authoritative state.
- Both the public website and the administrative dashboard query the exact same database records.
- If a record is updated or deleted in Supabase, the application reflects this change across all views without manual code edits.

### 2.2 Relational Model & Foreign Key Cascades
```text
auth.users (Supabase Auth Core)
   │
   └── profiles (id references auth.users ON DELETE CASCADE, username [UNIQUE], role)

subjects (id, title, slug, published, display_order)
   │
   └── modules (id, subject_id, title, slug, published, display_order)
          │
          └── lessons (id, module_id, title, slug, lesson_number, published, display_order)
                 ├── videos (id, lesson_id [UNIQUE], youtube_url, youtube_video_id)
                 └── materials (id, lesson_id, storage_path, material_type, file_size)

works_activities (id, title, slug, description, flyer_url, registration_url, fee, published)
```

1. `profiles.id` references `auth.users.id` ON DELETE CASCADE.
2. `modules.subject_id` references `subjects.id` ON DELETE CASCADE.
3. `lessons.module_id` references `modules.id` ON DELETE CASCADE.
4. `videos.lesson_id` references `lessons.id` ON DELETE CASCADE.
5. `materials.lesson_id` references `lessons.id` ON DELETE CASCADE.

### 2.3 Safe Media Cleanup on Deletion
When an administrator deletes a lesson:
1. The server queries the existing lesson along with its associated records.
2. If physical storage file paths exist (in `engivault-videos` or `engivault-materials`), they are pruned via the Supabase Admin Storage API.
3. The database row is deleted from `public.lessons`.
4. PostgreSQL cascades the deletion to child `videos` and `materials` metadata rows.
5. The action is recorded in `activity_logs`.
6. Targeted Next.js cache invalidation is executed.

### 2.4 Safe Video Preservation on Edit
When editing a lesson:
- The mutation identifier is strictly the immutable database UUID (`id`), never the mutable title or slug.
- If no replacement video link is provided, existing video association is preserved intact.
- If a replacement YouTube link is submitted:
  1. The link is validated and sanitized via `lib/utils/youtube.ts`.
  2. The `videos` record is updated with the new canonical URL and video ID.
  3. Associated cache paths are immediately revalidated.

### 2.5 Admin Mutation Flow
```text
Admin UI (e.g. Edit Lesson Modal)
       │
       ▼
HTTP PATCH /api/admin/lessons
       │
       ▼
Session Authentication (`getAdminSession()`)
       │
       ▼
Zod Input Validation (`lessonUpdateSchema`)
       │
       ▼
Database Mutation (`createAdminClient().from('lessons').update(...)`)
       │
       ▼
Activity Audit Logging (`logActivity('Lesson Updated', 'lesson', {...})`)
       │
       ▼
Targeted Next.js Cache Invalidation (`revalidateContentHierarchy(...)`)
       │
       ▼
HTTP 200 OK + Updated Record
       │
       ▼
Admin UI refreshed & Success Toast displayed
```

### 2.6 Public Read Flow
- Public requests use `createServerSupabase()` configured with `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Supabase Row Level Security (RLS) ensures public clients can only read records where `published = true` and whose parent module and subject are also published.
- Video playback is powered by validated YouTube embeds. Downloadable study materials are served securely via time-limited signed URLs or validated proxy routes. Private bucket storage paths are never directly readable without authorization.

---

## 3. Targeted Cache Invalidation Architecture

To prevent stale data without resorting to disabling caching globally, ENGIVAULT uses the centralized cache invalidation helpers in `lib/cache/revalidate.ts`.

When any curriculum mutation occurs, `revalidateContentHierarchy({ subjectSlug, moduleSlug, lessonSlug })` invalidates:
1. **Public Homepage:** `/` (refreshes the "Latest Recorded Lectures" and subject stats).
2. **Public Subject Catalog:** `/subjects`
3. **Public Subject Detail:** `/subjects/[subjectSlug]`
4. **Public Module Detail:** `/subjects/[subjectSlug]/[moduleSlug]`
5. **Public Lesson Detail:** `/subjects/[subjectSlug]/[moduleSlug]/[lessonSlug]`
6. **Admin Dashboard Views:** `/admin/dashboard`, `/admin/dashboard/subjects`, `/admin/dashboard/modules`, `/admin/dashboard/lessons`, `/admin/dashboard/videos`, `/admin/dashboard/materials`.

When a FOLE WORKS activity is created or updated, `revalidateWorksActivity(slug)` invalidates `/fole-works`, `/fole-works/[slug]`, and flyer routes.

---

## 4. Security & Access Control Architecture

### 4.1 Three Distinct Access Modes
1. **Guest Mode (Default):**
   - Instant access to curriculum hierarchies, YouTube lecture embeds, downloadable notes, and FOLE WORKS activities.
   - Zero login walls or prompts.
2. **Student Mode:**
   - Public self-service account registration with alphanumeric username (3–20 chars) and password (8–72 chars).
   - Maps usernames to internal non-routable addresses (`<username>@students.fole.invalid`).
   - Server-side account creation via Supabase service-role `auth.admin.createUser()` with `email_confirm: true`.
   - Client sessions managed through standard HTTP-only SSR cookie tokens (`@supabase/ssr`).
   - Dedicated `/account` page for profile inspection and self-service password updates.
   - Intentionally omitted email recovery (replaced by administrator-assisted password resets).
3. **Admin Mode:**
   - Single-field access code authentication posting to `/api/admin/login`.
   - Issues an HMAC-SHA256 signed `engivault_admin_session` cookie (7-day validity, HttpOnly, SameSite=Lax, Secure in production).
   - Unlocks the administrative dashboard, student directory, content authoring, and mutation APIs.

### 4.2 Independent Session Isolation
- Admin authority derives exclusively from server-side HMAC signature verification of `engivault_admin_session` via `getAdminSession()`.
- Student sessions possess zero administrative privileges.
- The two session systems operate independently; logging out of one never terminates the other. If both cookies exist, the UI renders the administrative controls.

### 4.3 Database-Backed Rate Limiting
- Backed by the `auth_rate_limits` table and atomic PostgreSQL RPC `check_and_increment_rate_limit(p_key, p_window_seconds, p_max_attempts)`.
- Client IPs are hashed using SHA-256 before insertion to preserve visitor privacy.
- Rate limits enforced on admin login (6 attempts / 15 min), student login (6 attempts / 15 min per IP and username), and student registration (3 attempts / 15 min).
- Returns HTTP 429 Too Many Requests with standard `Retry-After` header.

### 4.4 Next.js 16 Edge Proxy Gate
- Next.js 16 replaces `middleware.ts` with `proxy.ts`.
- `proxy.ts` performs a fast, zero-overhead edge check for admin cookie presence on `/admin/*` routes before delegating to full server-side cryptographic signature verification in layouts and route handlers.

### 4.5 Serverless Execution & Secret Protection
- All route handlers performing mutations, cryptographic hashing, or session verification declare `export const runtime = "nodejs"`.
- Private credentials (`SUPABASE_SECRET_KEY`, `ADMIN_ACCESS_CODE`, `ADMIN_SESSION_SECRET`, `RESEND_API_KEY`) are kept strictly server-only.
- Local filesystem persistence is strictly disabled in production (`NODE_ENV === "production"` or `VERCEL === "1"`).
