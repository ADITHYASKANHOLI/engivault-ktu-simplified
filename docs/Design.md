# FOLE — Design System & Visual Guidelines

**Brand:** FOLE — Free Open Learning & Education  
**Context:** Student-led learning community at College of Engineering Vadakara  
**Product areas:** KTU learning resources, FOLE SPACE, FOLE WORKS, student accounts and administration  
**Design direction:** Editorial academic, open and practical, grounded in real campus identity.

---

## 1. Design principles

1. **Content before decoration.** Pages must communicate through hierarchy, alignment, typography and spacing before adding visual effects. Every decoration must have a clear job.
2. **FOLE-specific imagery.** Prefer supplied FOLE identity assets, campus photographs, actual course material, event flyers and real product states. Do not add generic technology illustrations or stock-photo placeholders where real content exists.
3. **Distinct page structures.** Learning catalogues, event listings, space check-in and administration have different jobs. They may share tokens and controls, but should not be forced into identical three-card feature grids.
4. **Quiet surfaces.** Prefer a clear canvas, hairline dividers and selective grouping. A card is appropriate when it represents an independent item or action; do not wrap every section in a card.
5. **Accessible interaction.** Every interactive element must have a visible focus state, usable touch target, clear label and meaningful hover state. Honor `prefers-reduced-motion`.
6. **Responsive by default.** Keep content readable on narrow screens. Important controls and text must not depend on hover or large viewports.

## 2. Color tokens

| Role | Value | Use |
|---|---|---|
| Paper | `#F7F6EF` | Main public canvas |
| Surface | `#FFFFFF` | Content surfaces and forms |
| Ink | `#17231C` | Primary text |
| Muted | `#647168` | Supporting text |
| FOLE green | `#176B45` | Primary actions, links and active states |
| Deep green | `#123D2B` | Major brand panels and media backdrops |
| Soft green | `#E8F0E8` | Subtle active or selected states |
| Divider | `#DCE2DA` | Hairline borders and section separation |

Use semantic colors only for their meaning: success, warning, error and informational state. Do not introduce unrelated accent colors for decoration. The administration area may use darker operational surfaces, but it should retain consistent status meanings and readable contrast.

## 3. Typography

- **Interface text:** System sans-serif stack for reliable rendering and fast loading.
- **Editorial headings:** `.fole-heading` (Georgia / Times fallback), reserved for major public page titles and selected section headings.
- **Monospace:** Use sparingly for subject codes, dates, identifiers, sequence numbers and other genuinely technical metadata.
- Prefer sentence case for headings and navigation. Avoid excessive tracking and all-caps labels except concise metadata.
- Establish hierarchy with a small, consistent type scale. Body text should remain comfortable to read, with generous line-height.

## 4. Layout and component rules

- Main content width: `max-w-7xl` or `max-w-[1440px]`, centered with responsive horizontal padding.
- Header: full-width, opaque, fixed navigation bar with a simple bottom divider. No floating glass capsule.
- Buttons: solid FOLE green for the primary action; white or transparent with a visible border for secondary actions. Use square or modest corner radii.
- Cards: use white surfaces and subtle borders. Avoid default shadows, hover elevation, nested cards and excessive rounding.
- Media: preserve native aspect ratios. Use overlays only when necessary for text or controls to remain readable.
- Dialogs and drawers may use a dark translucent backdrop. Blur is reserved for a specific overlay only when it improves separation; it is not a general surface treatment.
- Motion should explain a state change or provide feedback. Do not animate every section on scroll, use decorative particles, or add pointer-following cursor effects.

## 5. Patterns to avoid

Do not add these as default treatments:

- Generic blue/purple/cyan gradient hero backgrounds, gradient text or decorative glowing blobs.
- Glassmorphism, liquid-glass surfaces, blurred layers or translucent cards for ordinary content.
- Decorative technical grids, abstract blobs, floating geometry or meaningless watermark motifs.
- Identical three- or four-column icon-and-paragraph grids for every page.
- A pill, badge or kicker above every heading when it repeats the heading.
- Large shadows, oversized rounded corners and elevation on every component.
- Generic stock imagery when FOLE or course-specific media is available.
- Non-functional carousels, cursor effects, sparkle decorations or animations that do not help users complete a task.

These are review signals, not absolute prohibitions. A visual treatment may be used when it expresses a real brand, content or interaction requirement.

## 6. Brand assets

- FOLE wordmark: `public/branding/fole-logo.png` / `components/branding/FoleLogoVector.tsx`.
- FOLE emblem: `public/branding/fole-emblem.png`.
- FOLE SPACE identity: `public/branding/fole-space-logo.png`.
- FOLE WORKS identity: `public/branding/fole-works-logo.png`.
- Homepage campus image: `public/images/fole-hero-campus.png`.
- Intro film: `public/videos/fole-intro.mp4` and `public/videos/fole-intro-poster.jpg`.

Do not redraw, recolor or distort supplied official marks without explicit approval.

---

## References informing this system

- Nielsen Norman Group, [5 Principles of Visual Design in UX](https://www.nngroup.com/articles/principles-visual-design/): scale, hierarchy, balance, contrast and grouping.
- Nielsen Norman Group, [Why Does a Design Look Good?](https://www.nngroup.com/articles/why-does-design-look-good/): consistent typography, alignment, spacing and a coherent visual system.
- InterfaceKit, [What makes a website look AI-generated?](https://blog.interfacekit.io/what-makes-a-website-look-ai-generated): product specificity, consistency across routes and decoration that supports rather than replaces information architecture.
