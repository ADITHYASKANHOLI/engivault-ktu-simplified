<p align="center">
  <img src="public/branding/engivault-official-logo.png" alt="ENGIVAULT Logo" width="560" />
</p>

# ENGIVAULT — KTU Simplified

**ENGIVAULT** is an open educational platform engineered specifically for APJ Abdul Kalam Technological University (KTU) engineering students. It provides a structured, high-yield academic repository containing recorded video classes, module-by-module syllabus breakdowns, handwritten formula summaries, and exam question notes.

---

## About the Project

ENGIVAULT was built to organize and deliver KTU-oriented academic learning resources. The Kerala Technological University engineering curriculum is rigorous and intensive, often challenging students with tight semester timelines and demanding exam patterns. 

ENGIVAULT simplifies this preparation by breaking down heavy university courses into systematic, modular learning paths. Students can stream high-definition lectures, review derivation walkthroughs, and download curated revision notes without paywalls or friction.

---

## Main Subjects

ENGIVAULT organizes content around core KTU syllabus schemes (2019 & 2024 schemes), including:

- **KTU Mathematics:** Linear Algebra, Calculus, Differential Equations, Transforms, and Numerical Methods (MAT101, MAT102, MAT201, etc.).
- **Engineering Graphics:** Orthographic projections, isometric views, section of solids, and development of surfaces (EST110).
- **Electrical Engineering:** DC circuit analysis, AC circuits, magnetic circuits, machines, and electronics fundamentals (EST130 Basics of Electrical & Electronics Engineering).
- **Additional KTU-Oriented Subjects:** Extensible curriculum framework supporting Computer Science, Mechanical, Civil, and Electronics engineering courses.

---

## Features

All documented features reflect existing implementations within the current codebase:

- **Public / User Learning Interface:** Clean syllabus explorer, subject overviews, module index, integrated video lecture player, and instant material download links.
- **Admin Authentication:** Secure administrator access protected by `scrypt` key derivation hashing, timing-safe equality verification, and signed HTTP-only session cookies.
- **Subject Management:** Full lifecycle management (create, read, update, delete, reorder, and publish/draft toggles) for university subjects.
- **Module & Lesson Management:** Hierarchical syllabus breakdown enabling administrators to create, edit, reorder, and delete modules and individual lessons.
- **Recorded Lecture Management:** Video lecture association, duration tracking, direct playback URLs, and signed URL generation for secure streaming.
- **Study Material Management:** Upload and download handling for formula sheets, handwritten revision notes, and previous year university question paper solutions.
- **Publishing & Draft Workflow:** Explicit publication status control allowing educators to prepare lessons in draft mode before releasing them publicly.
- **Supabase-Backed Content Management:** Authoritative cloud database with PostgreSQL Row Level Security (RLS) policies and storage buckets serving as the single source of truth.
- **Responsive Interface:** Adaptive layout with fluid responsive design across desktop (1440px), tablet (768px/1024px), and mobile (390px) viewports, including mobile navigation drawers.

---

## Admin Panel

The **Admin Control Room** (`/admin/dashboard`) provides an authoritative management workspace for educators and platform administrators:

1. **Dashboard Overview:** Metric cards summarizing total published subjects, active modules, video lectures, and study documents.
2. **Subject & Module Consoles:** Form controls for slug generation, scheme selection, credit weighting, and module sequencing.
3. **Lesson CRUD:** Intuitive interfaces for creating new lessons, modifying existing lecture metadata without losing attached media, and safely removing lessons with cascading cleanup.
4. **Upload Wizard:** Multi-step upload wizard designed for direct-to-storage media uploads, bypassing serverless upload size limits.
5. **System Settings:** Control over platform name, tagline, about narrative, contact email, and official branding assets.

---

## Technology Stack

The project is built with modern web technologies:

- **Framework:** Next.js 16 (Turbopack, App Router, React Server Components)
- **Library:** React 19
- **Language:** TypeScript 5.7+ (Strict Mode)
- **Styling:** Vanilla Tailwind CSS with custom atmospheric design tokens
- **Database & Storage:** Supabase (PostgreSQL Database & S3-compatible Object Storage)
- **Icons:** Lucide React
- **Validation:** Zod Schema Validation
- **Version Control & CI/CD:** Git & GitHub

---

## Data Architecture

Supabase PostgreSQL serves as the **single source of truth** for all academic content and application data:

- **PostgreSQL Database:** Relational schema enforcing referential integrity across `subjects`, `modules`, `lessons`, `videos`, `materials`, `site_settings`, and `activity_logs`.
- **Row Level Security (RLS):** Strict security policies ensuring public read access to published courses while restricting write, update, and delete mutations to authorized service roles.
- **Supabase Storage:** Dedicated storage buckets (`engivault-videos`, `engivault-materials`, `engivault-thumbnails`, `engivault-branding`) delivering media via secure signed URLs.
- **Cache Synchronization:** Direct database queries paired with targeted Next.js cache revalidation to guarantee that admin updates immediately appear in public views.

---

## External KTU Link

The **About** section of the website includes a dedicated navigation button:

> **Explore the KTU Scheme**

Clicking this button redirects students and educators directly to the official Kerala Technological University portal:

- **Official KTU Portal:** [https://ktu.edu.in/home](https://ktu.edu.in/home)

This provides students with immediate access to official KTU academic regulations, curriculum schemes, examination schedules, and university announcements.

---

## Local Development

### Prerequisites
- Node.js 18.18+ or 20+
- npm, pnpm, or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ADITHYASKANHOLI/engivault-ktu-simplified.git
   cd engivault-ktu-simplified
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Configure your Supabase URL, anon key, and admin access hash in `.env.local`.

4. Start the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Run production build and lint checks:
   ```bash
   npm run lint
   npm run build
   ```

---

## Environment Variables

The application requires the following environment variables (defined in `.env.local` for development and in your hosting provider for production):

| Variable Name | Description |
| :--- | :--- |
| `ADMIN_ACCESS_CODE` | `ADMIN_ACCESS_CODE=<set this in Vercel Environment Variables>` (Server-only secret administrator access code) |
| `NEXT_PUBLIC_SUPABASE_URL` | Public HTTPS endpoint for your Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous API key for client queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only secret service role key (Never expose to client) |
| `ADMIN_ACCESS_CODE_HASH` | Optional legacy `scrypt` hash fallback for access code |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL of the deployed application (e.g., `http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_NAME` | Display name of the platform (Default: `ENGIVAULT`) |

> [!IMPORTANT]
> In your Vercel Project Settings under Environment Variables, set:
> ```bash
> ADMIN_ACCESS_CODE=<set this in Vercel Environment Variables>
> ```
> This code is validated server-side only on `/api/admin/login` and is never exposed to the client bundle or browser.

> [!CAUTION]
> Never commit `.env` or `.env.local` files containing actual secret keys or credentials to version control.

---

## Deployment

The application is optimized for deployment on **Vercel**:

1. Push your code to the GitHub repository: `engivault-ktu-simplified`.
2. Connect your GitHub repository to a new project in the [Vercel Dashboard](https://vercel.com).
3. In the Vercel Project Settings, configure the Environment Variables listed above.
4. Deploy the project. Next.js App Router will generate optimized static and server-rendered routes automatically.

---

## GitHub Repository

- **Repository Name:** `engivault-ktu-simplified`
- **Owner:** `ADITHYASKANHOLI`
- **Repository URL:** [https://github.com/ADITHYASKANHOLI/engivault-ktu-simplified](https://github.com/ADITHYASKANHOLI/engivault-ktu-simplified)

---

## Project Status

- **Database & Sync:** Active — Supabase PostgreSQL schema with RLS and complete Lesson CRUD synchronization.
- **Branding & UI:** Active — Official unboxed ENGIVAULT logo displayed freely with native transparency across all viewports.
- **Curriculum Navigation:** Active — Syllabus hierarchy and direct external link to the official KTU portal (`https://ktu.edu.in/home`).
- **Production Readiness:** Build and lint checks pass with 0 errors. Ready for curriculum population and live deployment.
