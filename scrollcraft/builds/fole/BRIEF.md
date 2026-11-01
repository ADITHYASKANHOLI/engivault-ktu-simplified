# BRIEF.md — FOLE: Free Open Learning & Education

> Self-authored under explicit creative delegation. The user provided a comprehensive 400-line brief covering identity, purpose, visual concept, three interactive scenes, palette, typography, activities, technical spec, responsiveness, and quality restrictions. All answers below are drawn verbatim from that document.

---

## 1. Vibe (three to five words)

Curious. Intellectual. Experimental. Open. Cinematic.

References: a research institution's silent corridor at 3am; a philosophy seminar notebook with margin annotations; the Barbican Centre wayfinding system; a Kubrick wide shot with one lit object.

---

## 2. The scroll journey

The visitor arrives at a question — one luminous point on black. That point becomes an idea. The idea connects to others. The connections reveal a field. The field is open, expansive, and theirs to enter.

Section by section:
1. A single question. Deep black. The cursor is the only warmth.
2. The question expands — particles emerge, typography assembles.
3. Particles begin connecting. Lines appear. Ideas linking to ideas.
4. The graph breathes. Connections multiply. The structure is alive.
5. The camera pulls back. The field is vast. FOLE is named.
6. The field resolves to an invitation. Two actions. Enter.

---

## 3. Energy curve

- Calm, almost still, at the open. Held breath.
- Slowly waking through DISCOVER.
- Building toward UNDERSTAND — more connections, more motion.
- The UNDERSTAND section is the peak: dense with possibility, the loudest visual moment.
- Pulling back into awe for EXPLORE — the reveal that the field is enormous.
- Quiet resolve at the close — the invitation is gentle, not a shout.

---

## 4. Feeling curve (emotion → cause)

```
1  Stillness      the cursor alone on a field of black, one green point breathing
2  Curiosity      typography assembles from nothing; particles begin their orbit
3  Connection     thin green lines link nodes across a 3D space; ideas touching
4  AWE [PEAK]     the graph expands to fill the screen — depth revealed, field vast
5  Openness       camera pulls back; the whole field visible; FOLE named clearly
6  Resolve        the field quiets; one headline and two actions remain
```

Peak sentence: "The lines connected and the whole screen became a field of ideas I hadn't known was there."

Tell-someone sentence: "It's the site where a single point of light grows into a living map of ideas, and you realise the field was always open."

Authored silence: the first screen holds for one full breath before typography begins (greet cue at 0.0, hold to 0.15, then kinetic begins).

---

## 5. Signature move

**The curiosity trace.** A thin horizontal green line, fixed at the very bottom of the viewport for the entire scroll journey, that accumulates marks — tiny vertical notches — one each time the visitor passes a significant connection in the WebGL graph. By the time they reach the close, the line is a record of every idea they crossed. It reads as a timeline of the journey they just took. It is also the scene navigation: clicking a notch jumps to that scene. No prior build has this.

---

## 6. Grammar choice

**Typographic poster** grammar — but with a procedural WebGL canvas as the ground, not a photographic one.

Why the other seven lost:
- Filmic one-shot: requires scrub video clips we do not have and cannot generate (no KIE_AI_API_KEY). More importantly, FOLE's brief literally prescribes a continuous st=0..2 state machine, which maps perfectly to the poster grammar's scale-driven pinned acts.
- Chaptered editorial: forbids full-bleed scrub and magnetic CTA — but it also requires a paper ground, which conflicts with the brief's deep-black #070A08.
- Live surface: requires the page to behave like a running product. FOLE is not a software tool.
- Continuous world: requires worldflight video clips. Not available.
- Gallery/catalog: for object ranges. FOLE is one unified argument, not a catalogue.
- Split stage: requires two sides held in tension. FOLE's argument is singular: one opening, one journey, one field.
- Rhythmic cutlist: bans `pin` entirely, which is the primary device this journey needs for its held-breath beats.

Typographic poster grammar fits because: type is the imagery here; the WebGL canvas is the ground, not photography; scale contrast carries the emotional weight; the grammar's lifted display cap (continuous hero moment) is exactly what a three-act visual journey through 0..2 needs.

---

## 7. One world or distinct scenes?

Distinct scenes — three acts that feel clearly different — held together by one continuous WebGL canvas that evolves across all three. The canvas itself is the connective tissue; each act changes what the canvas shows, but the canvas never cuts.

---

## 8. Assets

- `fole-logo.png` — the official FOLE logo, present in project branding.
- No scrub video clips (no KIE key, not needed).
- No photography (brief forbids it).
- WebGL procedural particle system with Three.js — self-generating.
- All typography via Google Fonts (Geist fallback or DM Sans).

---

## Fingerprint plan

| Dimension | This build |
|---|---|
| Grammar | Typographic poster (WebGL ground) |
| Nav treatment | Ultra-minimal 2px-height fixed bar; logo left, four text links right; no CTA in bar; bar fades to invisible at scroll-top and solidifies on scroll |
| Hero device | WebGL canvas ground + pin with greet kinetic headline and pointer-responsive particle field |
| Act-sequence shape | pin(3.2) → pin(3.8) → pin(3.4) → flow → pin(1.2) — 5 acts, ~12.8 total vh |
| Close pattern | Pin resolves to centred FOLE mark + two inline text links side by side (not a button island); trace rail completes with all notches visible |
| Signature move | Curiosity trace rail: thin bottom line accumulating notches on WebGL connection events; clickable navigation |

---

## CTA destinations

- "EXPLORE FOLE" → `#explore` anchor (bottom of page, scrolls to activities)
- "OUR ACTIVITIES" → `#activities` anchor
Both are real in-page links, not invented URLs.

