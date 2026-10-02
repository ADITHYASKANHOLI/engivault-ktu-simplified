# ENGIVAULT Project Knowledge & Rules

This project is ENGIVAULT (repository `ENGIVAULT02`), a production engineering academic learning platform.

### Core Rules for AI Assistants
1. **Academic Hierarchy:** Department / Branch → Semester / Year → Subject → Module / Unit → Topic → Lecture.
2. **Central Unit:** The Lecture is the primary academic asset. All lectures feature YouTube-based video playback.
3. **YouTube Validation:** Use `lib/utils/youtube.ts` for all extraction and validation. Reject non-YouTube domains and arbitrary iframes.
4. **Role Separation:** Admin features (Add/Edit Lecture, Academic Structure) are strictly behind authenticated admin session cookies and server-side checks.
5. **Data Layer:** Dual-mode persistence supporting live Supabase and local zero-config JSON store.
6. **No Breaking Changes:** Retain backward compatibility for legacy uploaded videos and existing subjects/modules.
7. **Git Discipline:** Maintain repository `ENGIVAULT02` on branch `main`.
8. **Vercel Production Compatibility:** ENGIVAULT is a Vercel-native serverless application. Local filesystem persistence (`.engivault-local-store.json`) is strictly disabled in production. Supabase PostgreSQL is the sole authoritative database; YouTube powers all lectures; Supabase Storage hosts documents. All mutations and crypto routes declare `runtime = "nodejs"`. Never commit secrets or expose private keys to client bundles.
