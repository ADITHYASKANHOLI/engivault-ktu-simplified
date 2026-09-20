# ENGIVAULT — Design System & Visual Guidelines

**Brand Name:** ENGIVAULT  
**Tagline:** KTU Learning. Simplified.  
**Design Direction:** Academic Modernism, Engineering Clarity, Technical Elegance, Glassmorphism.

---

## 1. Core Visual Principles

1. **Engineering Precision:**
   Clean borders, subtle grid overlays (`bg-tech-grid`), sharp typography, and structured hierarchical containers reflecting technical discipline.
2. **Atmospheric Depth:**
   Soft translucent glass surfaces (`backdrop-blur-md`, `bg-white/80`), gentle ambient gradient glows, and layered cards with refined hairline borders (`border-slate-200/80`).
3. **Restraint Over Flash:**
   Purposeful micro-interactions, responsive hover states, smooth transitions (200ms ease), and zero-delay ripple mouse tracking that complements without distracting from study content.
4. **Dual Interface Aesthetics:**
   - **Public Portal:** Bright, airy, welcoming cloud-inspired palette with royal blue, deep indigo, and electric cyan accents.
   - **Admin Control Room:** Dark navy sidebar (`#0B132B`), crisp contrast white operational surfaces, and standardized metric cards designed for high data density and effortless management.

---

## 2. Color Palette

### Primary Academic Tones
- **Deep Slate Ground:** `#07111F` / `#0B132B` — Primary header/footer and admin sidebar foundation.
- **Royal Blue Accent:** `#1D4ED8` (`blue-700`) — Primary call-to-action buttons, active navigation states.
- **Deep Indigo:** `#4338CA` (`indigo-700`) — Gradient transitions, badge borders, and card elevations.
- **Electric Cyan:** `#06B6D4` (`cyan-500`) / `#22D3EE` (`cyan-400`) — Eyebrow badges, pulse indicators, and technical details.
- **Canvas Gray:** `#F7F9FC` — Soft off-white background preventing eye strain during long lecture viewing sessions.

### Semantic Status Colors
- **Published / Live:** Emerald (`bg-emerald-100`, `text-emerald-800`, `border-emerald-200`).
- **Draft / Inactive:** Slate (`bg-slate-100`, `text-slate-600`, `border-slate-200`).
- **Media Attached:** Blue (`bg-blue-100`, `text-blue-800`, `border-blue-200`).
- **Critical / Danger:** Rose / Red (`bg-rose-50`, `text-rose-700`, `border-rose-200`).
- **Warning:** Amber (`bg-amber-50`, `text-amber-700`, `border-amber-200`).

---

## 3. Typography Hierarchy

- **Primary Sans:** Inter / System UI stack (`font-sans`, `-apple-system, BlinkMacSystemFont, Segoe UI, Roboto`).
- **Technical Monospace:** JetBrains Mono / SF Mono (`font-mono`) — Used for subject codes (`MAT 101`, `EST 110`), lecture orders (`#01`, `#02`), durations, storage paths, and slug identifiers.

### Scale:
- **Hero Title:** `text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08]`
- **Section Headers:** `text-3xl sm:text-4xl font-black text-slate-900 tracking-tight`
- **Card Titles:** `text-base font-bold text-slate-900`
- **Body Text:** `text-sm text-slate-600 leading-relaxed font-normal`
- **Metadata Badges:** `text-[11px] font-mono font-bold uppercase tracking-wider`

---

## 4. Official Branding Lockup

The official ENGIVAULT brand lockup combines the vault shield monogram and bold modern typography:
```text
┌────┐  ENGI<span class="text-blue-700">VAULT</span>
│ ⬡  │  KTU LEARNING REPOSITORY
└────┘
```
- **Logo Asset:** Located at `public/branding/engivault-logo.png` (PNG) — official supplied artwork with transparent background.
- **Component:** `<EngivaultLogo />` in `components/branding/EngivaultLogo.tsx`.
- **Favicon:** `public/favicon.ico` and `app/icon.png`.

---

## 5. Component Patterns

### 5.1 Glass Cards
```css
bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xs
```

### 5.2 Admin Metric Cards
Standardized 4-column layout with fixed height (`h-32`), equal 24px padding (`p-6`), rounded corners (`rounded-2xl`), and consistent typography hierarchy.

### 5.3 Technical Grid Overlay
Subtle CSS grid pattern applied to hero and section backgrounds:
```css
.bg-tech-grid {
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 24px 24px;
}
```
