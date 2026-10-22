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

---

## 5. FOLE SPACE System Design & Concurrency Architecture

FOLE SPACE manages a physical collaborative learning space inspired by Thinkerspace Calicut, combining walk-in open study sessions with organized workshops and events.

```text
                                 ┌─────────────────────────────────┐
                                 │       FOLE SPACE SYSTEM         │
                                 └───────────────┬─────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
     ┌───────────────────────────┐                               ┌───────────────────────────┐
     │   OPEN SPACE (WALK-IN)    │                               │     EVENTS & CALENDAR     │
     ├───────────────────────────┤                               ├───────────────────────────┤
     │ • 30-minute study passes  │                               │ • Verified student hosts  │
     │ • Live occupancy counter  │                               │ • Monthly space calendar  │
     │ • Server offset countdown │                               │ • Free digital QR tickets │
     │ • Early self check-out    │                               │ • Check-In Desk & scanner │
     │ • Atomic FOR UPDATE locks │                               │ • Virtual QR-free check-in│
     └───────────────────────────┘                               └───────────────────────────┘
```

### 5.1 Concurrency & Postgres Atomic Row Locking
To eliminate race conditions across distributed Vercel serverless instances, all capacity assertions and state mutations execute inside PostgreSQL `SECURITY DEFINER` functions with row locks:
- **Open-Space Walk-Ins:** `rpc_space_checkin` locks the singleton `space_settings` row (`SELECT ... FOR UPDATE`) before calculating active occupancy `(checked_out_at IS NULL AND expires_at > now())`. If 2 parallel requests attempt to claim the final remaining seat, exactly 1 succeeds while the other is rejected with a clean capacity error.
- **Event Registrations:** `rpc_space_register_event` locks the target `space_events` row (`SELECT ... FOR UPDATE`), asserting current registered count < event capacity.
- **Strict Database Uniqueness:** Enforced via constraints:
  - Partial unique index on `space_sessions(user_id)` where `checked_out_at IS NULL AND status = 'active'` prevents duplicate active walk-in sessions.
  - Unique constraint on `space_event_registrations(event_id, user_id)`.
  - Unique constraint on `space_event_checkins(registration_id)`.

### 5.2 Serverless Time and Expiry Management
- Vercel functions cannot maintain background worker loops or polling daemons. Expiry is computed **lazily at read time** (`expires_at > now()`).
- The public status API returns `server_now` (PostgreSQL `now()`). Client countdown timers compute the clock offset between device local time and server time, preventing client clock tampering from distorting countdown durations.
- All timestamps store PostgreSQL `timestamptz` and format explicitly in `Asia/Kolkata` (IST, UTC+05:30).

### 5.3 Event Tickets & Unguessable QR Verification
- Each event registration generates a cryptographically random, unguessable 128-bit ticket code (`crypto.randomBytes(16).toString("base64url")`).
- Ticket QR codes encode the canonical payload: `FS1.<ticket_code>`. No personal data, email, or event parameters are exposed in the QR code.
- At the organizer desk, the camera scanner (using the native `BarcodeDetector` API with `qr-scanner` library fallback) streams the code to `POST /api/space/organizer/events/[id]/checkin/qr`.
- Ticket verification is strictly server-side: checks registration status, verifies event ID match, checks that the event is currently set to `live`, verifies that current time is within `[starts_at - early_window, ends_at + grace_window]`, and prevents duplicate check-in.

### 5.4 Virtual (QR-Free) Check-In
- If a registered attendee is unable to scan their QR code, they can check in virtually from their event ticket page.
- The virtual check-in action is enabled **only while the organizer has set the session to Live**.
- The database records the method (`qr`, `virtual`, or `manual`). Organizers can toggle virtual check-ins on/off for any session or revoke/undo check-ins from the desk.

### 5.5 Original Flyer Preservation Pipeline
- Organizers upload event flyers in original byte-for-byte fidelity (up to 10MB) directly to the private `fole-space-flyers` bucket via signed upload URLs.
- Server-side binary validation (`lib/space/flyer.ts`) inspects magic bytes (PNG `89 50 4E 47`, JPEG `FF D8 FF`, WebP `RIFF....WEBP`) and extracts natural image dimensions from binary headers (PNG IHDR, JPEG SOF, WebP VP8/VP8L/VP8X). SVG and non-raster files are strictly rejected to prevent script injection.
### 5.6 Database Schema, Migrations & Missing-Schema Fault Tolerance
- **Core Entities:** FOLE SPACE is backed by seven relational tables and one view in the `public` PostgreSQL schema:
  - `space_settings`: Singleton configuration (`id = 1`) with capacity, session minutes, timezone (`Asia/Kolkata`), extension flags, check-in windows, and opening hours JSON. Unrestricted access is modeled by empty `{}` JSON.
  - `space_sessions`: Walk-in study records tracking `user_id`, `started_at`, `expires_at`, `checked_out_at`, `source`, and `status`. Partial unique index prevents concurrent active sessions per student.
  - `space_organizers`: Verified faculty/student organizer designations with custom titles, badges, and active status.
  - `space_events`: Workshops, study meetups, and technical sessions with title, description, flyer path, capacity, start/end dates, virtual check-in toggles, and status workflow (`draft` → `published` → `live` → `completed` / `cancelled`).
  - `space_event_registrations`: Attendee bookings with unguessable ticket codes and unique `(event_id, user_id)` constraint.
  - `space_event_checkins`: Attendance logs recording ticket verification timestamp, method (`qr`, `virtual`, `manual`), scanner profile ID, and unique `registration_id` constraint.
  - `space_audit_log`: Canonical physical audit table tracking space master toggle events, forced checkouts, and organizer moderation. Strictly restricted to `service_role`.
  - `space_audit_logs`: Backward-compatible database view over `space_audit_log`, also restricted to `service_role`.
- **Private Storage Bucket Security:**
  - `fole-space-flyers` is a strictly private bucket (`public = false`) limited to 10MB raster images (`image/png`, `image/jpeg`, `image/webp`).
  - Unrestricted direct SELECT policies (`space_flyers_read` on `storage.objects`) are eliminated.
  - All public flyer downloads are streamed through the authorized server-side route `/api/space/events/[slug]/flyer`, which validates event publication, non-deleted status, and organizer authorization before streaming.
- **Migration Pipeline vs. Canonical Manual Setup:**
  - **Canonical Manual Setup Script:** [`supabase/manual/fole_space_setup.sql`](supabase/manual/fole_space_setup.sql) is the consolidated, owner-copyable script for Supabase SQL Editor. It contains all tables, indexes, RLS policies, 8 atomic `SECURITY DEFINER` RPCs (with row locking and `set search_path = public, pg_temp`), storage configuration, and automated 5-point verification checks.
  - **Tracked Migrations Chain:** For automated Supabase CLI or CI/CD deployments, migrations follow sequential, strictly unique version numbers:
    - `011_fole_space_system.sql`: Initial historical baseline FOLE SPACE schema.
    - `012_fole_space_security_hardening.sql`: Security hardening, reconciling audit log to singular table `space_audit_log`, dropping legacy storage policies, and enforcing secure `search_path` on RPCs.
- **PostgREST Schema Cache Reloading (`NOTIFY pgrst`):**
  - Issuing `NOTIFY pgrst, 'reload schema';` only rebuilds the internal PostgREST cache from PostgreSQL's *existing* tables. It cannot create missing tables. If `supabase/manual/fole_space_setup.sql` has not been run, reloading the cache succeeds but queries against `information_schema.tables` return 0 rows.
  - Owners must execute `supabase/manual/fole_space_setup.sql` directly in Supabase SQL Editor to provision the tables, RLS policies, RPC functions, and storage bucket.
- **Missing-Schema Detection & Controlled Fallbacks:**
  - Database queries and RPC calls are monitored by `isMissingSpaceSchemaError()` in `lib/space/errors.ts`, identifying structured codes (`PGRST205`, `42P01`, `PGRST202`, `42883`) and error messages referencing space relations.
  - When the database is unconfigured, public status route `GET /api/space/status` returns HTTP 503 with `{ "error": "FOLE SPACE database is not set up. Run migration 011.", "code": "FOLE_SPACE_DATABASE_NOT_CONFIGURED" }` instead of an unhandled 500 or misleading "space closed" state.
  - The Admin Overview (`AdminSpaceOverview.tsx`) and Settings Form (`AdminSpaceSettingsForm.tsx`) display a prominent amber setup banner directing the owner to run `supabase/manual/fole_space_setup.sql` and disables the master switch to prevent false success states.
- **Idempotency & Safe Verification:**
  - `supabase/manual/fole_space_setup.sql` is completely idempotent using `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and `INSERT ... ON CONFLICT (id) DO NOTHING` for seed settings, preventing accidental overwrites of administrator modifications.
  - Concludes with a 5-step verification block outputting tabular `PASS`/`FAIL` metrics and provides explicit rollback notes without executing destructive commands.
