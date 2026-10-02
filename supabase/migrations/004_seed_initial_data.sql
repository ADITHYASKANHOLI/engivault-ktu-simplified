-- ENGIVAULT Database Migration 004: Seed Initial Data
-- Seeds default site settings and the three core KTU curriculum subjects.

-- 1. Site Settings Initial Record
insert into public.site_settings (
  id,
  site_name,
  headline,
  tagline,
  contact_email,
  about_text,
  footer_text,
  social_links
) values (
  '00000000-0000-0000-0000-000000000001',
  'ENGIVAULT',
  'Learn Engineering. Build Confidence.',
  'KTU Learning. Simplified.',
  'contact@engivault.edu',
  'ENGIVAULT is a dedicated KTU engineering study companion providing video lectures, structured module breakdowns, and authentic study notes.',
  '© 2026 ENGIVAULT. All rights reserved. KTU Engineering Learning Simplified.',
  '{"github": "https://github.com", "linkedin": "https://linkedin.com", "telegram": "https://t.me"}'::jsonb
) on conflict (id) do nothing;

-- 2. Initial Subjects (Engineering Mathematics, Engineering Graphics, Electrical Engineering)
insert into public.subjects (
  id,
  title,
  slug,
  code,
  short_description,
  description,
  published,
  display_order
) values 
(
  '11111111-1111-1111-1111-111111111111',
  'Engineering Mathematics',
  'engineering-mathematics',
  'MAT 101',
  'Differential calculus, linear algebra, multivariable calculus, and infinite series for KTU first-year engineers.',
  'Comprehensive KTU curriculum coverage of Engineering Mathematics. Topics include limits, continuity, partial differentiation, matrices, eigenvalues, multiple integrals, and series expansions with solved university question papers.',
  true,
  1
),
(
  '22222222-2222-2222-2222-222222222222',
  'Engineering Graphics',
  'engineering-graphics',
  'EST 110',
  'Principles of engineering drawing, orthographic projection, isometric projection, and CAD drafting.',
  'Detailed step-by-step visual instruction on engineering drawing conventions, projection of lines, planes, and solids, sectional views, and isometric representations tailored for KTU university exams.',
  true,
  2
),
(
  '33333333-3333-3333-3333-333333333333',
  'Basics of Electrical Engineering',
  'electrical-engineering',
  'EST 130',
  'DC circuits, AC fundamentals, magnetic circuits, transformers, and AC/DC electrical machines.',
  'Foundational electrical engineering concepts covering Ohm''s and Kirchhoff''s laws, network analysis, single-phase and three-phase circuits, electromagnetic induction, transformer operation, and electrical safety standards.',
  true,
  3
)
on conflict (slug) do nothing;

-- 3. Initial Sample Modules for Engineering Mathematics
insert into public.modules (
  id,
  subject_id,
  title,
  slug,
  short_description,
  display_order,
  published
) values 
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Module 1 — Single Variable Calculus',
  'module-1-single-variable-calculus',
  'Limits, indeterminate forms, Rolle''s Theorem, Mean Value Theorems, Taylor''s series.',
  1,
  true
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'Module 2 — Multivariable Calculus',
  'module-2-multivariable-calculus',
  'Functions of two variables, partial derivatives, chain rule, maxima and minima.',
  2,
  true
)
on conflict (subject_id, slug) do nothing;

-- 4. Initial Sample Lessons
insert into public.lessons (
  id,
  module_id,
  title,
  slug,
  lesson_number,
  description,
  duration_seconds,
  published,
  display_order
) values 
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Lecture 01 — Introduction to Limits & L''Hospital''s Rule',
  'lecture-01-introduction-to-limits',
  1,
  'Understanding evaluation of limits, indeterminate forms (0/0, inf/inf), and applying L''Hospital''s rule with KTU exam problem walkthroughs.',
  1420,
  true,
  1
),
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Lecture 02 — Mean Value Theorems & Applications',
  'lecture-02-mean-value-theorems',
  2,
  'Rolle''s Theorem, Lagrange''s Mean Value Theorem, Cauchy''s Mean Value Theorem, geometric interpretation and analytical proofs.',
  1680,
  true,
  2
)
on conflict (module_id, slug) do nothing;
