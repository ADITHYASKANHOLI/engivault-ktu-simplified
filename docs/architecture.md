# ENGIVAULT — Architecture & System Design

**Platform:** ENGIVAULT  
**Tagline:** KTU Learning. Simplified.  
**Frontend / App Layer:** Next.js 15 (App Router, Turbopack, React 19, Tailwind CSS)  
**Backend / Database:** Supabase PostgreSQL with Row Level Security (RLS)  
**Storage:** Supabase Storage (Private Video & Material Buckets, Public Thumbnails & Branding)  
**Hosting Target:** Vercel (Next.js Application) + Supabase (Managed Cloud PostgreSQL & Storage)  
**Primary Repository:** GitHub `engivault`  

---

## 1. High-Level System Architecture

```text
                                 ┌──────────────────────────┐
                                 │     PUBLIC STUDENTS      │
                                 │   Desktop / Tablet / Web │
                                 └────────────┬─────────────┘
                                              │ HTTPS (Read-Only)
                                              ▼
                                 ┌──────────────────────────┐
                                 │      ADMIN OPERATOR      │
                                 │      Admin Dashboard     │
                                 └────────────┬─────────────┘
                                              │ HTTPS (Secure Cookie Session)
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   NEXT.JS 15 APPLICATION LAYER                                  │
│                                                                                                 │
│  ┌────────────────────────┐   ┌────────────────────────┐   ┌─────────────────────────────────┐  │
│  │   Public App Router    │   │  Admin Dashboard Shell │   │       Route Handlers (API)      │  │
│  │  - / (Homepage)        │   │  - /admin/dashboard    │   │  - /api/admin/lessons           │  │
│  │  - /subjects           │   │  - /admin/lessons      │   │  - /api/admin/modules           │  │
│  │  - /subjects/[slug]    │   │  - /admin/modules      │   │  - /api/admin/subjects          │  │
│  │  - /[modSlug]/[lesSlug]│   │  - /admin/uploads      │   │  - /api/admin/videos            │  │
│  │                        │   │  - /admin/videos       │   │  - /api/admin/materials         │  │
│  └───────────┬────────────┘   └───────────┬────────────┘   └────────────────┬────────────────┘  │
│              │ (SSR / ISR)                │ (Client Fetch)                  │ (Zod Validation)   │
│              └────────────────────────────┼─────────────────────────────────┘                    │
│                                           ▼                                                     │
│                    ┌──────────────────────────────────────────────┐                             │
│                    │     DATA ACCESS LAYER (`lib/queries`)       │                             │
│                    │  - Server Supabase SSR (Public Queries)      │                             │
│                    │  - Admin Client with Service Role (Mutations)│                             │
│                    │  - Cache Invalidation (`revalidate.ts`)      │                             │
│                    └──────────────────────┬───────────────────────┘                             │
└───────────────────────────────────────────┼─────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     SUPABASE CLOUD PLATFORM                                     │
│                                                                                                 │
│  ┌─────────────────────────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │               PostgreSQL Database               │  │           Supabase Storage           │  │
│  │  - subjects (Syllabus Root)                     │  │  - engivault-videos (Private 5GB)    │  │
│  │  - modules (Subject Modules)                    │  │  - engivault-materials (Private 100M)│  │
│  │  - lessons (Lectures & Classes)                 │  │  - engivault-thumbnails (Public 10M) │  │
│  │  - videos (MP4 Storage Metadata)                │  │  - engivault-branding (Public 10M)   │  │
│  │  - materials (PDF & Document Metadata)          │  │                                      │  │
│  │  - activity_logs (Audit Trail)                  │  │                                      │  │
│  │  - site_settings (Branding & Contact)           │  │                                      │  │
│  └─────────────────────────────────────────────────┘  └──────────────────────────────────────┘  │
│                                                                                                 │
│  Row Level Security (RLS) Policies:                                                             │
│  - Public anon key: SELECT only where published = true AND parent entities are published.       │
│  - Admin service role key: Server-only full read/write, never exposed to client browser.       │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Content Synchronization and CRUD

### 2.1 Supabase as the Single Source of Truth
The central tenet of ENGIVAULT's data architecture is that **Supabase PostgreSQL is the authoritative, immutable source of truth** for all curriculum records and media references:
- **Subjects**, **Modules**, **Lessons**, **Videos**, and **Materials** are stored in relational tables with foreign key constraints.
- No client-side `localStorage`, `sessionStorage`, static mock arrays, or in-memory caches hold authoritative state.
- Both the public website and the administrative dashboard query the exact same database records.
- If a record is updated or deleted in Supabase, the application reflects this change across all views without manual code edits.

### 2.2 Relational Model & Foreign Key Cascades
```text
subjects (id, title, slug, published, display_order)
   │
   └── modules (id, subject_id, title, slug, published, display_order)
          │
          └── lessons (id, module_id, title, slug, lesson_number, published, display_order)
                 ├── videos (id, lesson_id [UNIQUE], storage_path, duration_seconds)
                 └── materials (id, lesson_id, storage_path, material_type, file_size)
```

1. `modules.subject_id` references `subjects.id` ON DELETE CASCADE.
2. `lessons.module_id` references `modules.id` ON DELETE CASCADE.
3. `videos.lesson_id` references `lessons.id` ON DELETE CASCADE.
4. `materials.lesson_id` references `lessons.id` ON DELETE CASCADE.

### 2.3 Safe Media Cleanup on Deletion
When an administrator deletes a lesson:
1. The server queries the existing lesson along with its associated `videos` and `materials` records.
2. The storage file paths are extracted.
3. The server deletes the physical objects from the private storage buckets (`engivault-videos` and `engivault-materials`) via the Supabase Admin Storage API.
4. The database row is deleted from `public.lessons`.
5. PostgreSQL cascades the deletion to child `videos` and `materials` metadata rows.
6. The action is recorded in `activity_logs`.
7. Targeted Next.js cache invalidation is executed.

### 2.4 Safe Video Preservation on Edit
When editing a lesson:
- The mutation identifier is strictly the immutable database UUID (`id`), never the mutable title or slug.
- If no replacement video is uploaded, the existing video association is preserved intact.
- If a replacement video is provided:
  1. The new video file is uploaded to `engivault-videos`.
  2. The `videos` record is updated with the new storage path and metadata.
  3. The previous storage file is safely pruned after the database update succeeds.

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
- Video playback URLs and study material download links are generated dynamically as time-limited HMAC-SHA256 signed URLs via `getSignedVideoUrl` and `getSignedMaterialUrl`. Private bucket storage paths are never directly readable without a signed token.

---

## 3. Targeted Cache Invalidation Architecture

To prevent stale data without resorting to disabling caching globally, ENGIVAULT uses the centralized cache invalidation helper in `lib/cache/revalidate.ts`.

When any curriculum mutation occurs, `revalidateContentHierarchy({ subjectSlug, moduleSlug, lessonSlug })` invalidates:
1. **Public Homepage:** `/` (refreshes the "Latest Recorded Lectures" and subject stats).
2. **Public Subject Catalog:** `/subjects`
3. **Public Subject Detail:** `/subjects/[subjectSlug]`
4. **Public Module Detail:** `/subjects/[subjectSlug]/[moduleSlug]`
5. **Public Lesson Detail:** `/subjects/[subjectSlug]/[moduleSlug]/[lessonSlug]`
6. **Admin Dashboard Views:** `/admin/dashboard`, `/admin/dashboard/subjects`, `/admin/dashboard/modules`, `/admin/dashboard/lessons`, `/admin/dashboard/videos`, `/admin/dashboard/materials`.

This guarantees instantaneous consistency between admin changes and public displays across all browser sessions.

---

## 4. Security & Authentication Architecture

1. **Admin Access Code:**
   - Single authoritative bootstrap code managed through server-side `ADMIN_ACCESS_CODE` (timing-safe comparison).
   - Rate-limited login verification in `/api/admin/login` (with `/api/admin/verify-code` compatibility).
   - Successful verification issues an HTTP-only, secure, SameSite=Lax HMAC-signed session cookie (`engivault_admin_session`).
   - Secret keys and admin credentials are strictly server-side and never exposed to the client bundle.
2. **Service Role Isolation:**
   - `SUPABASE_SERVICE_ROLE_KEY` is strictly server-side and never prefixed with `NEXT_PUBLIC_`.
   - Browser client uses only `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Storage Security:**
   - Videos and study materials are stored in private buckets (`public: false`).
   - Access requires server-generated signed URLs with expiring signatures.
