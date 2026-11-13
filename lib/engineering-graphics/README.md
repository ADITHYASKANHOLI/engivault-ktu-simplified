# FOLE DraftLab — Engineering Graphics foundation

This feature is integrated into EngiVault at the route /engineering-graphics.

## Current implementation

- Model geometry is stored in millimetres and generated independently from the viewport.
- Solid generators currently cover regular prisms, regular pyramids, cylinders, cones, cubes and cuboids.
- The geometry layer supports X/Y/Z rotation and edge/plane intersections.
- Projection calculations generate front, top, side and isometric coordinates from the same vertex model.
- Each viewport has its own pan and zoom state.
- Mouse-wheel zoom is anchored at the cursor.
- Fit-to-view uses projected geometry bounds.
- The section preview computes intersections of model edges with a mathematical plane.
- Project export downloads a versioned JSON description of the current solid and view preferences.

## Current limitations

This is the first working foundation, not the complete CAD specification. The following are not yet implemented: true-length construction for inclined lines, full solid orientation relative to HP/VP with projectors, section hatching and true-shape construction, surface development, isometric-scale drafting, layers, dimension editing, project import/autosave, SVG/PDF drawing-sheet export, and guided Learn/Practice exercises.

The current solid renderer is a mathematical wireframe/axonometric renderer. It is not yet a shaded interactive Three.js scene. The section view currently shows edge/plane intersection points joined into a section outline; it does not yet calculate clipped faces or validate a closed section surface for every degenerate plane placement.

## Coordinate conventions

- Model coordinates use millimetres.
- Front projection uses (x, z).
- Top projection uses (x, y).
- Side projection uses (y, z).
- Isometric axonometric projection:
  - X = (x - y) cos(30 degrees)
  - Y = z - (x + y) sin(30 degrees)

Viewport mapping is separate from model geometry. For a screen point and viewport centre:

- screenX = centreX + panX + zoom * worldX
- screenY = centreY + panY - zoom * worldY

Cursor-anchored zoom preserves the world point under the cursor.

## Verification note

The repository build and UI must be checked after integration. Do not describe the unimplemented features above as complete.
