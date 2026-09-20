<p align="center">
  <img src="public/branding/engivault-official-logo.png" alt="ENGIVAULT Logo" width="560" />
</p>

<h1 align="center">ENGIVAULT — KTU Learning. Simplified.</h1>

<p align="center">
  <strong>Production-ready educational platform engineered for APJ Abdul Kalam Technological University (KTU) students.</strong><br />
  Recorded video lectures, structured syllabus modules, downloadable study notes, and an authoritative administrator control room.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture--data-flow">Architecture</a> •
  <a href="#-database-schema--rls">Database & RLS</a> •
  <a href="#-content-synchronization--crud">Sync & CRUD</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-security">Security</a> •
  <a href="#-license">License</a>
</p>

---

## 1. Project Overview
**ENGIVAULT** is a dedicated learning platform for Kerala Technological University (KTU) engineering courses. It bridges the gap between official university syllabi and student exam preparation by organizing recorded video lectures, handwritten teacher notes, formula cheatsheets, and solved university question papers into an intuitive, modular structure.

---

## 2. Core Features
- **Curriculum Hierarchy:** Structured progression from Subject &rarr; Module &rarr; Lesson &rarr; Video & Materials.
- **Authoritative Admin Control Room:** Dedicated administrative panel for creating, updating, reordering, publishing, and deleting subjects, modules, lessons, and media.
- **Full Lesson CRUD:** Instant creation, editing with existing video preservation, safe deletion with cascading storage cleanup, and one-click publish toggles.
- **Private Video Streaming:** Encrypted video delivery via short-lived HMAC signed URLs from private Supabase Storage buckets.
- **Direct-to-Storage Upload Wizard:** Multi-step upload wizard allowing video uploads up to 5GB without Vercel serverless request body size limitations.
- **Live Search & Catalog Filter:** Instant client and server search across all published subjects, modules, and lecture titles.
- **Targeted Next.js Cache Invalidation:** Dynamic ISR revalidation keeping public and admin views synchronized without stale data.
- **Zero-Delay Ripple Cursor:** Bespoke ambient mouse tracking animation tuned for desktop usability.

---

## 3. Technology Stack
- **Framework:** Next.js 15 (App Router, Turbopack, React 19)
- **Language:** TypeScript 5.7+ (Strict Mode)
- **Styling:** Tailwind CSS 3.4+ with custom technical engineering grid tokens and glassmorphism
- **Database:** Supabase PostgreSQL 15+ with Row Level Security (RLS)
- **Authentication:** Admin bootstrap code authentication using scrypt password hashing & secure HTTP-only cookies
- **Object Storage:** Supabase Storage (`engivault-videos`, `engivault-materials`, `engivault-thumbnails`, `engivault-branding`)
- **Hosting Target:** Vercel (Next.js Edge & Serverless) + Supabase (Managed Cloud PostgreSQL & S3-compatible Storage)
- **Icons:** Lucide Icons
- **Validation:** Zod 3.24+

---

## 4. Architecture & Data Flow

```text
Supabase PostgreSQL (Single Source of Truth)
   │
   ├── Server/Data Layer (lib/queries/index.ts)
   │      ├── Public Queries (createServerSupabase + RLS published=true)
   │      └── Admin Mutations (createAdminClient + Service Role + Audit Logs)
   │
   ├── Cache Invalidation Layer (lib/cache/revalidate.ts)
   │      └── revalidateContentHierarchy()
   │
   └── Presentation Layer
          ├── Public Portal (/subjects, /subjects/[slug]/[mod]/[les])
          └── Admin Dashboard (/admin/dashboard, /admin/dashboard/lessons)
```

Both public students and administrators read from and write to the same Supabase PostgreSQL database. No client-side `localStorage`, mock arrays, or disconnected copies hold authoritative data.

---

## 5. Database Schema & Relationships

The relational model enforces strict referential integrity:

```text
subjects (id UUID PK, title, slug UNIQUE, code, published, display_order)
   │
   └── modules (id UUID PK, subject_id FK CASCADE, title, slug, published, display_order)
          │
          └── lessons (id UUID PK, module_id FK CASCADE, title, slug, lesson_number, published, display_order)
                 ├── videos (id UUID PK, lesson_id FK UNIQUE CASCADE, storage_path, duration_seconds)
                 └── materials (id UUID PK, lesson_id FK CASCADE, storage_path, material_type, file_size)
```

- Schema migration files are located under `supabase/migrations/`:
  - `001_initial_schema.sql`: Core tables, indexes, and updated_at triggers.
  - `002_create_rls_policies.sql`: Row Level Security policies.
  - `003_create_storage_policies.sql`: Storage buckets and bucket access policies.
  - `004_seed_initial_data.sql`: Seed data for initial subjects.

---

## 6. Row Level Security (RLS) Policies
- **Public (Anonymous):** Can select rows only where `published = true` and all parent entities (module, subject) are also published.
- **Admin:** Authenticated server routes use the Supabase Service Role key (isolated on the server) to perform full CRUD operations.
- **RLS is never disabled globally.**

---

## 7. Storage Architecture & Buckets
- `engivault-videos` (Private, 5GB max, video/mp4, video/webm): Lecture recordings accessible only via signed streaming URLs.
- `engivault-materials` (Private, 100MB max, application/pdf): Study documents accessible only via signed download URLs.
- `engivault-thumbnails` (Public, 10MB max, image/jpeg, image/png, image/webp): Course and video thumbnail graphics.
- `engivault-branding` (Public, 10MB max): Official logo and branding assets.

---

## 8. Content Synchronization & CRUD
- **Create:** Validates inputs via Zod, generates collision-resistant slugs, writes to Supabase, logs action, and invalidates Next.js cache routes.
- **Edit:** Identifies records by immutable UUID (`id`), updates database values, preserves existing attached media unless a replacement file is explicitly uploaded, and triggers targeted revalidation.
- **Delete:** Queries child videos and materials, purges the physical files from Supabase Storage buckets, and deletes the database row with cascading cleanup of metadata.
- **Publish / Unpublish:** Instant toggle between draft and published visibility.

---

## 9. Cache Invalidation Strategy
The centralized helper in `lib/cache/revalidate.ts` invalidates exact routes upon mutation:
- `/`
- `/subjects`
- `/subjects/[subjectSlug]`
- `/subjects/[subjectSlug]/[moduleSlug]`
- `/subjects/[subjectSlug]/[moduleSlug]/[lessonSlug]`
- `/admin/dashboard/*`

---

## 10. Admin Authentication & Bootstrap
ENGIVAULT utilizes a bootstrap Admin Access Code system:
- The access code is defined server-side using a cryptographic scrypt hash stored in `ADMIN_ACCESS_CODE_HASH`.
- Administrators authenticate at `/admin/login`.
- Rate limiting prevents brute-force attempts.
- Verified sessions receive an HTTP-only, SameSite=Lax JWT cookie.
- Hardcoded fallback hashes are strictly forbidden.

---

## 11. Environment Variables
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description | Exposure |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL | Client & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key | Client & Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase privileged service role key | **Server Only** |
| `ADMIN_ACCESS_CODE_HASH` | Scrypt hash of admin access code | **Server Only** |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (e.g. `http://localhost:3000`) | Client & Server |
| `NEXT_PUBLIC_SITE_NAME` | Site branding name (`ENGIVAULT`) | Client & Server |

---

## 12. Quick Start (Local Setup)

### Prerequisites
- Node.js 18.18+ or 20+
- npm 9+

### 1. Clone & Install
```bash
git clone https://github.com/your-username/engivault.git
cd engivault
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials in `.env.local`.

### 3. Generate Admin Access Code
```bash
node scripts/generate-admin-code.mjs
```
Copy the generated hash into `ADMIN_ACCESS_CODE_HASH` in `.env.local`.

### 4. Run Development Server
```bash
npm run dev
```
- Public Site: [http://localhost:3000](http://localhost:3000)
- Admin Console: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 13. Supabase Database Setup
Execute the migrations in `supabase/migrations/` sequentially via the Supabase Dashboard SQL Editor or Supabase CLI:
```bash
npx supabase db push
```

---

## 14. Uploading Lecture Media
1. Navigate to `/admin/dashboard/uploads`.
2. Select target Subject, Module, and Lesson.
3. Choose file type (Recorded Lecture Video or Study Document).
4. Drag and drop file (MP4 or PDF).
5. Specify title, description, and publishing preference.
6. Click **Upload & Synchronize**.

---

## 15. Managing Lessons
From `/admin/dashboard/lessons`:
- **Filter:** Filter by subject, module, or search keyword.
- **Create:** Click "New Lecture" to add a lesson to any syllabus module.
- **Edit:** Click the pencil icon to modify title, duration, description, or replace video.
- **Delete:** Click the trash icon to open the confirmation dialog with media cleanup warnings.
- **Publish Toggle:** Click the "PUBLISHED" or "DRAFT" pill to toggle visibility.

---

## 16. Search Functionality
- Live search bar in public header and admin interface.
- Queries published subjects, syllabus modules, and video lecture titles.
- Immediately reflects title changes and deletions.

---

## 17. Design System & Aesthetics
- **Theme:** Academic Modernism with glassmorphism and technical grid accents.
- **Typography:** Modern Sans for readability, JetBrains Mono for syllabus codes and metrics.
- **Color System:** Deep Slate (`#07111F`), Royal Blue (`#1D4ED8`), Electric Cyan (`#06B6D4`), Canvas Gray (`#F7F9FC`).
- Detailed guidelines in [`docs/Design.md`](docs/Design.md).

---

## 18. Security Posture
- No service role keys exposed in client bundles.
- No hardcoded access code hashes.
- Rate-limited admin login with IP tracking.
- Expiring signed URLs for private media.
- Input validation on all API endpoints via Zod schemas.

---

## 19. Available Scripts
| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local Next.js dev server with Turbopack |
| `npm run build` | Builds production application bundle |
| `npm run start` | Starts production server |
| `npm run lint` | Runs ESLint analysis |
| `node scripts/generate-admin-code.mjs` | Generates admin access code and scrypt hash |

---

## 20. Testing & Verification
Verify CRUD and synchronization:
1. **Create:** Add a new lecture in Admin &rarr; check that it appears on the public module page.
2. **Edit:** Rename the lecture in Admin &rarr; refresh public page &rarr; new title appears.
3. **Delete:** Delete the lecture in Admin &rarr; verify it disappears from public page and storage.
4. **Publish:** Toggle draft status &rarr; verify it is hidden from public students and visible to admin.

---

## 21. Production Deployment (Vercel)
1. Push repository to GitHub.
2. Import project into Vercel.
3. Set environment variables from `.env.local`.
4. Deploy!

---

## 22. Roadmap & Future Extensions
- Student authentication and personalized progress tracking.
- Interactive module quizzes and practice questions.
- University question paper archive with solution keys.
- Real-time classroom announcements.

---

## 23. Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 24. License & Credits
- **License:** MIT License.
- **Developed for:** Kerala Technological University engineering student community.
- **Official Branding:** ENGIVAULT Project.
