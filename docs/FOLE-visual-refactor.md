# FOLE visual refactor notes

## Purpose

This update replaces the generic, effect-heavy visual layer with a consistent identity for FOLE — Free Open Learning & Education — while retaining the existing Next.js, React, Supabase, route, authentication and data architecture.

## Visual direction

- **Canvas:** warm paper (`#F7F6EF`) and white surfaces.
- **Brand colour:** FOLE forest green (`#176B45`) with deep green for high-emphasis panels.
- **Typography:** system sans-serif for interface text; restrained editorial serif for selected public headings.
- **Layout:** clear full-width navigation, readable content width, purposeful dividers, and modest corner radii.
- **Cards:** reserved for independent content or actions; less nesting, less elevation, and fewer repeated card grids.
- **Imagery:** prefer supplied FOLE marks, the campus hero image, course media and actual event assets.
- **Motion and effects:** remove pointer-following cursor effects, decorative tech grids, gratuitous glows, sparkle flourishes and ornamental glass surfaces. Keep motion for functional feedback and keep backdrop treatment for real dialogs/drawers.

## Updated areas

The refactor touches the shared visual tokens and shell, homepage hero and sections, subject and lesson browsing, lectures, materials, FOLE SPACE, FOLE WORKS, student-facing event pages, common cards, media controls, dialogs, loading/error states and admin-facing brand labels. It also removes the unused liquid-glass showcase route and pointer effect, and updates the architecture/design documentation and default site copy to FOLE.

## Compatibility safeguards

Public-facing names and copy now use FOLE. Existing implementation identifiers — including `engivault` storage bucket names, cookies, API paths, package names, source paths and repository name — are intentionally preserved because existing Supabase and deployment configuration may depend on them.

## Validation performed

- TypeScript/TSX source transpilation scan: 181 files, zero syntax diagnostics.
- Local import resolution scan: zero unresolved relative or aliased imports.
- Existing regression suite, sections 1–9, with a temporary local store generated from the repository's own seed data: 50 checks passed, zero failed.

A complete Next.js production build and the remaining dependency-backed test sections could not be run in the supplied environment because the package executables are not present in the partial `node_modules` tree and the npm registry could not be resolved (`EAI_AGAIN`). This is an environment validation limitation, not a confirmed successful build. Install dependencies in a network-enabled environment, then run `npm ci`, `npm run lint`, `npm test` and `npm run build` before deployment.
