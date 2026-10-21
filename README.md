<p align="center">
  <img src="public/branding/fole-logo.png" alt="FOLE Logo" width="560" />
</p>

# ENGIVAULT — Academic Learning Platform

**ENGIVAULT** is an engineering-focused academic digital vault built for engineering students to provide a structured, accessible, and high-fidelity curriculum ecosystem. Developed by **FOLE** (Free Open Learning & Education), a student-led initiative associated with the College of Engineering Vadakara (CEV), the platform unites curriculum lectures, syllabus hierarchies, peer study materials, and community workshops into one cohesive application.

Guiding Principle: *Learn Together. Build Together. Grow Together.*

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
                                └── Watch / Learn (16:9 YouTube Player)
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

## 🔐 Authentication & Access System

ENGIVAULT implements a secure, three-mode access architecture with strict separation between public guest browsing, student accounts, and administrative operations:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ENGIVAULT ACCESS SYSTEM                          │
├──────────────────────┬────────────────────────────┬─────────────────────────┤
│      GUEST MODE      │        STUDENT MODE        │        ADMIN MODE       │
├──────────────────────┼────────────────────────────┼─────────────────────────┤
│ • Default mode       │ • Self-service account     │ • Top-right Login modal │
│ • No login walls     │ • Username + password      │ • Admin Access Code     │
│ • Zero prompt modals │ • SSR Supabase Auth cookie │ • HMAC-signed cookie    │
│ • Unrestricted reads │ • Dedicated /account page  │ • /admin/* dashboard    │
│ • Lectures/Materials │ • Admin-assisted PW reset  │ • Student & Content mgmt│
└──────────────────────┴────────────────────────────┴─────────────────────────┘
```

### 1. Guest Mode (Default)
- **Unrestricted Access:** Visitors open the platform and immediately browse curriculum branches, semesters, subjects, modules, YouTube lectures, study materials, and FOLE WORKS activities.
- **Zero Friction:** No mandatory registration, login modals, blocking overlays, or redirects ever impede guests.

### 2. Student Mode (Self-Service Accounts)
- **Username as Login ID:** Students register using an alphanumeric username (3–20 characters, `[a-z0-9_]`, lowercase) and password (8–72 characters, NIST SP 800-63B compliant).
- **Internal RFC 2606 Email Mapping:** Supabase Auth requires an email format. Usernames are mapped server-side to internal non-routable addresses (`<username>@students.fole.invalid`). This internal address is never exposed to users and never receives mail.
- **Server-Side Registration:** Account creation posts to `POST /api/auth/student/signup`. The server verifies username availability, checks password strength against common weak passwords, and calls the Supabase service-role `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username } })`. It then immediately initializes a server-side SSR session via `@supabase/ssr` cookies so the student is authenticated seamlessly without confirmation emails.
- **No Email Recovery Policy:** Because accounts use non-routable internal emails, self-service email recovery is intentionally absent. Students are informed during sign-up to remember their credentials. If forgotten, administrators can reset student passwords from the Admin Dashboard.
- **Student Account Hub (`/account`):** Authenticated students can inspect their profile, view account security details, and change their password (verified server-side against their current password).

### 3. Admin Mode (Signed HMAC Session)
- **Access Code Authentication:** Administrators open the "Admin" tab in the header Login dialog or visit `/admin/login`, entering the server-configured `ADMIN_ACCESS_CODE`.
- **HMAC-SHA256 Signed Session:** Successful authentication issues an `engivault_admin_session` cookie signed with HMAC-SHA256 (using `ADMIN_SESSION_SECRET` or `ADMIN_ACCESS_CODE`), expiring in 7 days (`HttpOnly`, `SameSite=Lax`, `Secure` in production).
- **Protected Surface:** All `/admin/*` routes and `/api/admin/*` handlers strictly verify the HMAC signature and timestamp server-side via `getAdminSession()`.
- **Student Management (`/admin/dashboard/students`):** Administrators can view registered students, reset student passwords (`auth.admin.updateUserById`), suspend accounts, or delete student profiles. All admin mutations are audited via `logActivity()`.

### 4. Independent Session Isolation
- **No Role Cross-Contamination:** Admin access never derives from `profiles.role` or client tokens. Student credentials provide zero administrative permissions.
- **Independent Lifecycles:** Logging out of a student session (`POST /api/auth/student/logout`) does not destroy an admin session, and logging out of admin (`POST /api/admin/logout`) does not log out a student. If both are active, the header renders the administrative controls.

### 5. Multi-Layered Rate Limiting
- **Database-Backed Sliding Window:** Backed by the `auth_rate_limits` table and atomic PostgreSQL RPC `check_and_increment_rate_limit`.
- **Privacy-Preserving IP Hashing:** Client IPs from `x-forwarded-for` / `x-real-ip` are hashed with SHA-256 before storage.
- **Enforced Thresholds:**
  - Admin login: 6 attempts per 15-minute window per IP.
  - Student login: 6 attempts per 15-minute window per IP and per username.
  - Student signup: 3 attempts per 15-minute window per IP.
  - Returns HTTP 429 Too Many Requests with standard `Retry-After` header.
- **Resilient Dev Fallback:** Automatically falls back to an in-memory sliding window when Supabase credentials are absent during local offline testing.

---

## 🗺️ Platform Routes & Endpoints

| Route | Access | Description |
| :--- | :--- | :--- |
| `/` | Public Guest | Homepage with quick branches, search, and activity highlights |
| `/subjects` | Public Guest | Complete engineering curriculum catalog |
| `/subjects/[subjectSlug]` | Public Guest | Subject detail page with modules and syllabus overview |
| `/subjects/[subjectSlug]/[moduleSlug]/[lessonSlug]` | Public Guest | 16:9 responsive YouTube lecture player and linked notes |
| `/lectures` | Public Guest | Cross-discipline lecture browser with cascading filters |
| `/materials` | Public Guest | Searchable PDF notes, derivation guides, and question papers |
| `/fole-works` | Public Guest | FOLE community workshops, technical sessions, and flyers |
| `/fole-works/[slug]` | Public Guest | Shareable activity details with registration link and flyer download |
| `/account` | Student Only | Student profile hub with password change form |
| `/about` | Public Guest | Mission, CEV student leadership, and platform overview |
| `/contact` | Public Guest | Contact form forwarding inquiries directly to `folecev@gmail.com` |
| `/admin/login` | Public Admin | Standalone access-code login page |
| `/admin/dashboard` | Admin Only | Platform overview, statistics, and recent activity logs |
| `/admin/dashboard/students` | Admin Only | Student directory and admin-assisted password resets |
| `/admin/dashboard/lessons` | Admin Only | Curriculum lecture management with YouTube link validation |
| `/admin/dashboard/modules` | Admin Only | Module and unit management |
| `/admin/dashboard/subjects` | Admin Only | Department and subject management |
| `/admin/dashboard/works/activities` | Admin Only | FOLE WORKS activity management and publication workflow |
| `POST /api/auth/student/signup` | Public | Student account registration (rate limited) |
| `POST /api/auth/student/login` | Public | Student login with username and password (rate limited) |
| `POST /api/auth/student/logout` | Student | Destroys Supabase student session cookies |
| `POST /api/auth/student/change-password` | Student | Verifies current password and updates credentials |
| `GET /api/auth/student/me` | Student | Returns current student profile |
| `POST /api/admin/login` | Public | Validates admin access code and sets signed HMAC session |
| `POST /api/admin/logout` | Admin | Clears admin session cookie and redirects |
| `GET/POST /api/admin/students` | Admin | Lists students and executes admin password resets |
| `GET /api/health` | Public | Serverless deployment health check probe |

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

## 📁 Project Architecture & Structure

```
├── app/
│   ├── (public)/                 # Public routes with shared SiteHeader & SiteFooter
│   │   ├── account/              # Student account management page
│   │   ├── fole-works/           # Community activities and event flyers
│   │   ├── lectures/             # Multi-discipline lecture catalogue
│   │   ├── materials/            # Downloadable study notes and question banks
│   │   └── subjects/             # Academic hierarchy syllabus traversal
│   ├── admin/                    # Administrative interface protected by proxy & session
│   │   ├── dashboard/            # Administrative dashboard views
│   │   │   └── students/         # Student user management & password resets
│   │   └── login/                # Standalone admin login view
│   ├── api/                      # Serverless Route Handlers (runtime = "nodejs")
│   │   ├── admin/                # Admin-only endpoints (session verified)
│   │   │   ├── login/            # Admin access-code authentication
│   │   │   ├── logout/           # Admin session invalidation
│   │   │   └── students/         # Student reset, suspend, and delete actions
│   │   ├── auth/student/         # Student authentication endpoints
│   │   │   ├── signup/           # Service-role student registration
│   │   │   ├── login/            # Student username authentication
│   │   │   ├── logout/           # Student sign-out
│   │   │   └── change-password/  # Student password update
│   │   ├── contact/              # Resend contact email forwarding
│   │   └── health/               # Serverless deployment health probe
│   └── proxy.ts                  # Next.js 16 lightweight edge proxy gate
├── components/
│   ├── account/                  # Student account view and change-password form
│   ├── admin/                    # Admin sidebar, dashboards, and student table
│   ├── auth/                     # Accessible LoginDialog modal & AuthMenu trigger
│   ├── layout/                   # SiteHeader (with AuthMenu) and SiteFooter
│   ├── materials/                # Downloadable material cards and filters
│   └── works/                    # FOLE WORKS cards, forms, and share button
├── lib/
│   ├── auth/                     # Session cookies, student helpers, and token crypto
│   │   ├── session.ts            # Admin HMAC cookie getters and setters
│   │   ├── student.ts            # Student username-to-email mapping & domains
│   │   └── token.ts              # Node crypto HMAC-SHA256 signing and sanitization
│   ├── security/                 # Rate limiting and CSRF origin guards
│   │   ├── db-rate-limit.ts      # Database-backed atomic rate limiter
│   │   └── origin.ts             # Safe origin and same-origin CSRF verification
│   ├── supabase/                 # Supabase client factories
│   │   ├── admin.ts              # Service-role client (server-side only)
│   │   ├── client.ts             # Browser anonymous client
│   │   └── server.ts             # SSR cookie-aware client (@supabase/ssr)
│   └── validation/               # Zod validation schemas
│       ├── schemas.ts            # Curriculum and admin payload schemas
│       └── student.ts            # Username, password, and signup schemas
├── supabase/
│   └── migrations/               # PostgreSQL schema migrations (001–010)
│       └── 010_student_auth_and_rate_limits.sql
└── scripts/
    └── test-engivault.mjs        # 17-section automated regression test suite
```

---

## 💻 Technology Stack

- **Framework:** Next.js 16.4 (App Router, Turbopack, React Server Components)
- **Edge Routing:** Next.js 16 `proxy.ts` (modern replacement for middleware)
- **Frontend Library:** React 19
- **Type Safety:** TypeScript 5.7+ (Strict Mode)
- **Styling:** Tailwind CSS v4 with custom emerald accents and dark-mode tokens
- **Persistence Layer:** Dual-Mode Architecture:
  - **Production:** Supabase PostgreSQL with Row Level Security (RLS) & Storage buckets
  - **Local/Development:** Synchronized fallback local store (`.engivault-local-store.json`) for zero-config offline execution
- **Authentication:** Dual Independent Architecture:
  - **Students:** Supabase Auth (email+password via `@supabase/ssr` cookies)
  - **Admins:** Signed HMAC-SHA256 HttpOnly session cookies
- **Validation:** Zod Schema Validation (`lib/validation/schemas.ts`, `lib/validation/student.ts`)
- **Icons:** Lucide React

---

## 🚀 Setup & Local Development

### 1. Prerequisites
- Node.js 20+ (Node 20 or Node 24 recommended)
- npm (or pnpm / yarn)
- Git

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/ADITHYASKANHOLI/engivault-ktu-simplified.git
cd engivault-ktu-simplified

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
# Supabase configuration (optional for offline testing; required for student auth and production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
SUPABASE_SECRET_KEY=your-service-role-or-secret-key

# Admin Authentication
ADMIN_ACCESS_CODE="your-admin-access-code"
# Optional dedicated HMAC signing secret:
# ADMIN_SESSION_SECRET="your-32-character-random-hmac-secret"

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=ENGIVAULT

# Email Forwarding (Resend API)
RESEND_API_KEY=re_your_api_key
CONTACT_EMAIL_TO=folecev@gmail.com
CONTACT_EMAIL_FROM="FOLE Web <onboarding@resend.dev>"
```

### 4. Supabase Setup Steps
1. **Execute Database Migrations:** Run migrations `001` through `010` in your Supabase SQL Editor. Migration `010_student_auth_and_rate_limits.sql` adds:
   - `profiles.username` column with unique `lower(username)` index.
   - Username format constraint (`chk_profiles_username_format`).
   - Trigger `handle_new_user()` on `auth.users` automatically inserting student profiles with `role = 'student'`.
   - `public.auth_rate_limits` table with atomic RPC `check_and_increment_rate_limit`.
2. **Disable Public Sign-Up in Dashboard:**
   - Navigate to **Authentication → Providers → Email** in your Supabase Dashboard.
   - Turn **OFF** the toggle: *"Allow new users to sign up"*.
   - *Why?* This prevents malicious actors from calling `supabase.auth.signUp()` with the public anon key to bypass username uniqueness, reserved word checks, and rate limits. ENGIVAULT creates student accounts server-side via `auth.admin.createUser()` using the service-role client, which continues to operate cleanly with this setting disabled.

### 5. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

ENGIVAULT includes a comprehensive automated test suite verifying all critical requirements:

```bash
# Run 17-section unit & integration test suite
npm test

# Run type check & production build
npm run build

# Run linter
npm run lint

# Run live HTTP & route verification
node scripts/verify-browser-routes.mjs
```

### Automated Test Coverage (114 passing tests):
- **1. Academic Hierarchy & Data Integrity:** Multi-discipline support (CSE, ECE, EEE, ME, CE, AI&DS, IT), Semester traversal (S1–S8), Subject, Module, Topic, and Lecture associations.
- **2. YouTube Parsing & Security:** Canonical watch URLs, short URLs, shorts URLs, embed URLs, timestamp normalization, domain whitelist validation, rejection of non-YouTube URLs, and XSS injection neutralization.
- **3. Add & Edit Lecture Validation:** Required lecture title, required YouTube video link, invalid URL rejection, and preview synchronization.
- **4. Backward Compatibility:** Legacy MP4 video loading and thumbnail fallbacks.
- **5. Academic Search:** Topic querying and empty search resilience.
- **6. Contact Form & Email Forwarding:** Schema validation, email header injection prevention, honeypot spam protection, rate limiting, and Resend API forwarding to `folecev@gmail.com`.
- **7. Materials Catalog:** Multi-tier academic catalog, soft-delete filtering, and secure downloads.
- **8. FOLE WORKS Activities:** Activity schema validation, flyer uploads, registration fee parsing, external platform URL sanitization, and Web Share API.
- **9. Original Flyer Preservation:** Aspect-ratio preservation, high-definition Open Graph metadata, and flyer streaming.
- **10. Authentication & Access Control:**
  - Student username schema validation (3–20 chars, lowercase, letters, numbers, underscores).
  - Reserved username blacklist rejection (`admin`, `fole`, `engivault`, `root`, `support`, etc.).
  - Student password length (8–72 chars) and weak password blacklist rejection.
  - Identity validation (rejection of passwords matching usernames).
  - Internal RFC 2606 email mapping (`<user>@students.fole.invalid`).
  - Origin verification and cross-origin POST blocking.
  - Open-redirect sanitization and relative path enforcement.
  - HMAC-SHA256 admin token tamper-resistance and expiration enforcement.
  - Database-backed sliding window rate limiting.
  - Migration 010 schema verification.
  - Node.js serverless runtime enforcement (`runtime = "nodejs"` on all auth routes).

---

## 🛡️ Security Architecture & Policies

- **Serverless-Safe Execution:** Every Route Handler performs independently without shared in-memory state or background daemons. All cryptographic, auth, and mutation handlers declare `export const runtime = "nodejs"`.
- **Zero Local Filesystem Persistence in Production:** In production (`NODE_ENV === "production"` or `VERCEL === "1"`), writing to local files or `.engivault-local-store.json` is strictly disabled. Supabase PostgreSQL is the sole authoritative database.
- **Strict Role Separation:** Students never see administrative controls, buttons, or endpoints. All `/api/admin/*` mutations enforce server-side HMAC session verification (`getAdminSession()`).
- **Server-Only Secrets:** Private keys (`SUPABASE_SECRET_KEY`, `ADMIN_ACCESS_CODE`, `ADMIN_SESSION_SECRET`, `RESEND_API_KEY`) are kept strictly server-only. They are never prefixed with `NEXT_PUBLIC_` and never included in client JavaScript bundles.
- **Row-Level Security (RLS):** All public reads enforce `published = true`. Direct table writes via the public anon key are blocked by PostgreSQL RLS policies.
- **Safe Cookie Directives:** All auth cookies (`engivault_admin_session`, Supabase SSR tokens) are set with `HttpOnly`, `SameSite=Lax`, and `Secure` in production environments.

---

## 🚢 Deploy to Vercel

ENGIVAULT is architected and tested as a **Vercel-native serverless application**.

1. **Connect GitHub Repository:** Import `engivault-ktu-simplified` on [Vercel](https://vercel.com).
2. **Framework Detection:** Vercel automatically configures the Next.js App Router and Turbopack.
3. **Environment Variables:** Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `ADMIN_ACCESS_CODE`, `NEXT_PUBLIC_SITE_URL`, and optionally `ADMIN_SESSION_SECRET` and `RESEND_API_KEY`.
4. **Deploy & Verify:**
   - Check the health check endpoint: `GET /api/health` returns `{ "ok": true, "status": "healthy" }`.
   - Test public guest browsing, student registration/login, and administrative dashboard.

---

## 📜 Git & Repository Maintenance

- **Canonical Repository:** `https://github.com/ADITHYASKANHOLI/engivault-ktu-simplified.git`
- **Default Branch:** `main`
- **Commit Discipline:** Conventional commits (`feat: ...`, `fix: ...`, `test: ...`, `docs: ...`).
- **Persistent Agent Guidelines:** See [AGENTS.md](AGENTS.md) and [GEMINI.md](GEMINI.md) for architectural rules and constraints.
