<p align="center">
  <img src="public/branding/fole-logo.png" alt="FOLE Logo" width="560" />
</p>

# ENGIVAULT — Academic Learning Platform

**ENGIVAULT** is an engineering-focused academic learning platform built to provide a structured, student-friendly academic ecosystem where engineering students can find their curriculum lectures and supporting study material in one organized place.

ENGIVAULT eliminates scattered learning materials across WhatsApp, YouTube playlists, Google Drive links, and random websites, bringing authentic academic instruction into an intentional, modern, and reliable digital vault.

---

## 🏛️ Academic Hierarchy

ENGIVAULT models engineering education into a scalable, normalized 6-tier hierarchy:

```
Department / Branch
  └── Semester / Year (Sem 1 to Sem 8)
        └── Subject
              └── Module / Unit
                    └── Topic
                          └── Lecture (Central Academic Content Unit)
                                └── Watch / Learn (16:9 Embedded Player)
```

The platform is designed for multi-disciplinary engineering education and includes:
- **Computer Science & Engineering (CSE)**
- **Electronics & Communication Engineering (ECE)**
- **Electrical & Electronics Engineering (EEE)**
- **Mechanical Engineering (ME)**
- **Civil Engineering (CE)**
- **Artificial Intelligence & Data Science (AI & DS)**
- **Information Technology (IT)**

---

## 🎯 The Student Experience

- **Intuitive Academic Navigation:** Minimal clicks from login to lecture player (`Branch` → `Semester` → `Subject` → `Module` → `Topic` → `Lecture`).
- **Academic Lectures Browser (`/lectures`):** Cascading filters by Department/Discipline, Semester (S1–S8), and Subject, paired with real-time academic search.
- **Section 14 Academic Lecture Cards:** Rapidly communicates context with Module tag, Lecture sequence (`LEC 01`), Subject & Topic tags, Faculty attribution, duration, and high-definition YouTube thumbnail with hover play overlay.
- **Dedicated 16:9 Lecture Player:** Official YouTube embed player integrated cleanly into the page without container overflows, flanked by 5-tier breadcrumbs, faculty profile card, and sequential lecture navigation (`← Previous Lecture`, `Back to Module`, `Next Lecture →`).
- **Study Materials & Question Banks:** Linked module notes, derivations, and question papers.
- **Strict Role Boundaries:** Students never see administrative controls or mutation endpoints.

---

## 🛠️ The Admin Experience

Authorized faculty and administrators manage academic content through a dedicated, protected dashboard (`/admin/dashboard`):

- **Add Lecture Workflow (Section 10 & 63):**
  - **Lecture Name** (*Required*)
  - **YouTube Video Link** (*Required*)
  - Department, Semester, Subject, Module, Topic, Faculty, Description
  - Live 16:9 YouTube video preview with a green **"Video Ready to Attach"** badge upon entering a valid URL.
  - Save button remains disabled until both required fields and valid YouTube video ID are validated.
- **Edit Lecture Workflow:**
  - Loads existing YouTube video URL and preview.
  - Allows seamless replacement of video link with instant preview update.
- **Academic Structure Management:** Full control over Departments, Semesters, Subjects, Modules, Topics, and Lectures.
- **Server-Side Authorization:** All administrative mutations are protected server-side via cryptographic session tokens.

---

## 📺 YouTube Lecture Architecture

ENGIVAULT adopts a high-performance, cost-effective YouTube-first video delivery model:

1. **Centralized Reusable Parser (`lib/utils/youtube.ts`):**
   - Supports all standard YouTube URL patterns:
     - `https://www.youtube.com/watch?v=VIDEO_ID`
     - `https://youtu.be/VIDEO_ID`
     - `https://www.youtube.com/shorts/VIDEO_ID`
     - `https://www.youtube.com/embed/VIDEO_ID`
     - URLs with query timestamps (`?t=42s`, `&feature=shared`)
   - Rejects non-YouTube domains, malformed strings, arbitrary `<iframe>` tags, and XSS attempts.
   - Extracts the strict 11-character base64url Video ID (`/^[a-zA-Z0-9_-]{11}$/`).
2. **Safe Embed Construction:**
   - Constructs embed URLs strictly from validated video IDs (`https://www.youtube.com/embed/${VIDEO_ID}`).
   - User-supplied arbitrary iframe HTML is never rendered.
3. **High-Definition Thumbnails:**
   - Automatically derives thumbnails (`https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg`) with fallback graphics.
4. **Backward Compatibility:**
   - Preserves legacy fields (`storage_path`, local MP4 files) with fallback HTML5 video playback so old content never crashes.

---

## 💻 Technology Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React Server Components)
- **Frontend Library:** React 19
- **Type Safety:** TypeScript 5.7+ (Strict Mode)
- **Styling:** Modern Tailwind CSS with custom academic and atmospheric tokens
- **Persistence Layer:** Dual-Mode Architecture:
  - **Production:** Supabase PostgreSQL with Row Level Security (RLS) & Storage buckets
  - **Local/Development:** Synchronized fallback local store (`.engivault-local-store.json`) for zero-config local execution
- **Validation:** Zod Schema Validation (`lib/validation/schemas.ts`)
- **Icons:** Lucide React & custom SVG components

---

## 🚀 Setup & Local Development

### 1. Prerequisites
- Node.js 18+ or 20+
- npm (or pnpm / yarn)
- Git

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/ADITHYASKANHOLI/ENGIVAULT02.git
cd ENGIVAULT02

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env.local` file from the provided `.env.example`:
```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Supabase configuration (optional for local development; if omitted, local file store activates)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Authentication
ADMIN_ACCESS_CODE="ENGIVAULT-6981-6BA7-A850"
ADMIN_ACCESS_CODE_HASH="scrypt:91351540be86a85ff458cbb78476fec6:96cb58a05986a8c5e156248d30f0f37d298e082884a7e84692c4f3d442a2c2a4b771668910dd8960432f0e0298b7a1739cfc7a6b59266d182a0f01140d1d9ceb"

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=ENGIVAULT
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

ENGIVAULT includes an automated test suite verifying all critical requirements:

```bash
# Run unit & integration test suite
npm test

# Run type check & production build
npm run build

# Run linter
npm run lint

# Run live HTTP & route verification
node scripts/verify-browser-routes.mjs
```

### Automated Test Coverage (24 passing tests):
- **YouTube Parsing & Security:** watch URLs, short URLs, shorts URLs, embed URLs, timestamp parameters, domain whitelist validation, rejection of non-YouTube URLs, and XSS injection neutralization.
- **Add Lecture Validation:** Required lecture title, required YouTube video link, invalid URL rejection, and successful creation.
- **Academic Hierarchy:** Multi-discipline support (CSE, ECE, EEE, ME, CE, AI&DS, IT), Semester traversal (S1-S8), Subject, Module, Topic, and Lecture associations.
- **Backward Compatibility:** Legacy MP4 lecture loading and thumbnail fallbacks.
- **Academic Search:** Topic querying and empty search resilience.
- **Authorization:** Unauthenticated admin mutation rejection (HTTP 401).

---

## 🚢 Deploy to Vercel

ENGIVAULT is architected, tested, and maintained as a **Vercel-compatible serverless production application**. It has zero dependency on local filesystems, long-lived server processes, or local JSON files in production.

### Step-by-Step Vercel Deployment Guide

1. **Connect GitHub Repository:** Link your GitHub account to [Vercel](https://vercel.com).
2. **Import `ENGIVAULT02`:** In the Vercel dashboard, click **Add New... → Project** and select the `ENGIVAULT02` repository.
3. **Select Framework:** Choose **Next.js** (Vercel automatically detects the Next.js App Router).
4. **Configure Environment Variables:** Under Project Settings → Environment Variables, configure the required variables (see environment table below). Never commit secret values to GitHub.
5. **Connect Supabase Database:** Ensure your production Supabase database has executed the migrations in `supabase/migrations/` so all tables (`departments`, `semesters`, `faculty`, `subjects`, `modules`, `topics`, `lessons`, `videos`, `materials`, `site_settings`, `activity_logs`) and RLS policies exist.
6. **Deploy Preview:** Create a feature branch or pull request in GitHub to trigger an automatic Vercel Preview deployment.
7. **Verify Preview:** Test the preview URL (`https://<project>-git-<branch>.vercel.app`) ensuring lecture browsing, search, and YouTube embedding load without error.
8. **Configure Production Variables:** Set production-specific secrets (`SUPABASE_SECRET_KEY`, `ADMIN_ACCESS_CODE`, `NEXT_PUBLIC_SITE_URL`) for the **Production** environment in Vercel.
9. **Deploy `main` to Production:** Merge your verified branch into `main` to trigger the automatic Vercel Production deployment.
10. **Verify Production:** 
    - Check the deployment health check endpoint at `/api/health` (returns `{ "ok": true, "status": "healthy" }`).
    - Verify the public lecture catalog and YouTube playback.
    - Log in to `/admin/login` and verify that creating, editing, and deleting lectures persists directly in Supabase PostgreSQL.
11. **Configure Domain & Auth Redirect URLs:** Add your custom domain in Vercel Project Settings → Domains. In Supabase Dashboard → Authentication → URL Configuration, add your production domain and preview domain wildcards (`https://*-your-team.vercel.app/**`) to the Allowed Redirect URLs.

---

### 🌐 Vercel Environment Separation Checklist

| Setting | Development | Preview | Production |
| :--- | :--- | :--- | :--- |
| **URL** | `http://localhost:3000` | `https://<deployment>.vercel.app` | `https://<production-domain>` |
| **Database Source** | Local dev Supabase or dev DB | Staging/Preview Supabase project | Authoritative Supabase PostgreSQL |
| **Video Delivery** | YouTube embeds | YouTube embeds | YouTube embeds |
| **Document Storage**| Supabase Storage (or dev bucket) | Supabase Storage (staging bucket) | Supabase Storage (production buckets) |
| **Local JSON Fallback**| Allowed (offline dev only) | **Strictly Disabled** | **Strictly Disabled** |
| **`NEXT_PUBLIC_SITE_URL`** | `http://localhost:3000` | Dynamic `VERCEL_URL` fallback | Canonical production domain |
| **Health Check** | `http://localhost:3000/api/health` | `https://.../api/health` | `https://.../api/health` |

---

### 🩺 Deployment Health Check Endpoint

ENGIVAULT provides a lightweight, serverless health probe at `/api/health`:
- **Route:** `GET /api/health`
- **Runtime:** Node.js serverless function (`runtime = "nodejs"`)
- **Safe Response:**
  ```json
  {
    "ok": true,
    "status": "healthy",
    "app": "ENGIVAULT",
    "environment": "production",
    "database": "configured",
    "timestamp": "2026-10-02T16:30:00.000Z"
  }
  ```
  *(Does not expose database credentials, secrets, or internal connection strings).*

---

## 📜 Git & Repository Maintenance

- **Canonical Repository:** `ENGIVAULT02`
- **Default Branch:** `main`
- **Commit Discipline:** Semantic commit messages (`feat: ...`, `fix: ...`, `refactor: ...`, `test: ...`).
- **Persistent Agent Guidelines:** See [AGENTS.md](AGENTS.md) and [GEMINI.md](GEMINI.md) for architectural rules and constraints that must never be broken by future contributors or AI agents.
