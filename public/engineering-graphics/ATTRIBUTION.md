# Engineering Graphics engine attribution

FOLE Engineering Graphics Studio integrates the interactive EG Suite simulation engine.

- Original project: https://github.com/Omega-Mu-Gamma-Studio/EG-Suite
- Original authors: Alberto Felix and Aaron Mcgeo
- Original project license: MIT (see LICENSE)
- Engine areas: Unit III–IV projection of solids, sections, true shape and surface development; Unit V isometric and orthographic views.
- 3D rendering: Three.js, pinned to 0.184.0 via jsDelivr import map.
- FOLE integration: guided Next.js setup interface, query-driven initial configuration bridge, responsive route and navigation integration.

The original ES-module engine is preserved in this directory to isolate its calculations from the FOLE app bundle. The guided setup translates polygon side lengths and circular diameters into the input conventions used by the respective engines.
