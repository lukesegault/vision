# ARCHIVE 26: static mockup design

## Intent
A polished, static, single-page mockup of an SSENSE-style archive and vintage
fashion store, styled after late 90s / early 2000s Prada-era futurist
editorials: petrol teal, cyan-blue, bottle green, cold fluorescent highlights,
CRT / surveillance overlays, gutterless mosaic. For looking at and showing off.
No backend, cart, filtering or checkout.

## Non-goals
Working cart, real filtering, product routing, real brand names or
copyrighted campaign photography, any change to the existing portfolio site.

## Location
`mockups/archive-26/index.html`, self-contained (inline CSS and JS, no build
step, no external assets except optionally Google Fonts). The existing React
site at the repo root is not modified.

## Sections
1. Header and hero: thin bar, wide-tracked serif wordmark "ARCHIVE 26", mono
   nav (WOMEN / MEN / ARCHIVE / JOURNAL). Full-bleed graded hero with fake
   `REC 0:39:11` overlay and slow fog drift.
2. Mosaic shop grid: ~12 tiles of mixed sizes, edge to edge, no gutters, no
   radii. Brand stamped bottom-right in serif caps, mono caption
   (`SS 1999 / ITALY / SIZE 46 / EUR 640`). Hover: scanlines, blur-to-sharp.
3. Specimen panel: one featured piece as a monitor wall (large tile plus 3
   small CRT-framed details) with a spec table (year, material, condition
   grade, provenance) and a disabled "Add to bag".
4. Journal strip and footer: two editorial cards with short invented copy,
   minimal footer.

## Visual system
- Colours: bg `#04100f`, petrol `#0b3b3f`, cyan-blue `#2f7f95`, frost green
  `#b9d8cc`, cold white `#e8f3f1`, defined as CSS custom properties.
- Type: wide-tracked serif caps (brands, wordmark), grotesque body, monospace
  captions and timecodes.
- Effects: teal-green duotone via blend modes, SVG-noise grain, scanlines via
  repeating gradient, blur-to-sharp reveals. Disabled under
  `prefers-reduced-motion`.
- Imagery: generated placeholders (layered gradients, fog, garment silhouette
  in SVG/CSS) tinted by the duotone. One `src` per tile can be swapped for a
  real photo later.
- Responsive: mosaic 6 columns on desktop down to 2 on phones, no horizontal
  scroll, 16px side gutter on text blocks.

## Content
Invented brands only (no real labels). Placeholder site name ARCHIVE 26.

## Verification
Render with Playwright at 1440px and 390px widths, inspect screenshots for
layout and contrast issues, confirm no horizontal overflow.

## Delivery
Commit on `claude/optimistic-ride-jgpydq` and push. Optionally publish as a
private artifact for viewing on any device.
