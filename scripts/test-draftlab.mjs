import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function loadTypeScript(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, strict: true },
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, "TypeScript transpilation should not produce errors");
  return import("data:text/javascript;base64," + Buffer.from(compiled.outputText).toString("base64"));
}

const viewport = await loadTypeScript("../lib/engineering-graphics/viewport.ts");
const geometry = await loadTypeScript("../lib/engineering-graphics/geometry.ts");
const projections = await loadTypeScript("../lib/engineering-graphics/projections.ts");

const initialViewport = { zoom: 2.4, panX: 83, panY: -41 };
const cursor = { x: 213, y: 176 };
const width = 920;
const height = 640;
const worldBefore = viewport.screenToWorld(cursor, initialViewport, width, height);
const zoomedViewport = viewport.zoomAt(initialViewport, cursor, 1.8, width, height);
const worldAfter = viewport.screenToWorld(cursor, zoomedViewport, width, height);
assert.ok(Math.abs(worldBefore.x - worldAfter.x) < 1e-9, "cursor-anchored zoom preserves world X");
assert.ok(Math.abs(worldBefore.y - worldAfter.y) < 1e-9, "cursor-anchored zoom preserves world Y");

const modelPoint = { x: 34.5, y: -18.25 };
const screenPoint = viewport.worldToScreen(modelPoint, initialViewport, width, height);
const restoredPoint = viewport.screenToWorld(screenPoint, initialViewport, width, height);
assert.ok(Math.abs(modelPoint.x - restoredPoint.x) < 1e-9, "world/screen conversion round-trips X");
assert.ok(Math.abs(modelPoint.y - restoredPoint.y) < 1e-9, "world/screen conversion round-trips Y");

const fit = viewport.fitBounds({ minX: -40, minY: -25, maxX: 40, maxY: 25 }, width, height);
assert.ok(fit.zoom > 0 && fit.zoom <= viewport.MAX_ZOOM, "fit-to-view returns a bounded positive zoom");

const cube = geometry.createSolidGeometry({ type: "cube", base: 60, depth: 60, height: 60, sides: 4 });
assert.equal(cube.vertices.length, 8, "cube has eight vertices");
assert.equal(cube.edges.length, 12, "cube has twelve unique edges");
assert.equal(cube.faces.length, 6, "cube has six faces");

const prism = geometry.createSolidGeometry({ type: "prism", base: 80, depth: 80, height: 100, sides: 6 });
assert.equal(prism.vertices.length, 12, "hexagonal prism has twelve vertices");
assert.equal(prism.faces.length, 8, "hexagonal prism has two bases and six side faces");

const pyramid = geometry.createSolidGeometry({ type: "pyramid", base: 80, depth: 80, height: 100, sides: 5 });
assert.equal(pyramid.vertices.length, 6, "pentagonal pyramid has six vertices");
assert.equal(pyramid.faces.length, 6, "pentagonal pyramid has six faces");

const midSection = geometry.intersectGeometryWithPlane(cube, { x: 0, y: 0, z: 1 }, 0);
assert.equal(midSection.length, 4, "horizontal mid-plane through cube intersects four vertical edges");

const rotatedCube = geometry.rotateGeometry(cube, 90, 0);
const originalEdgeLength = geometry.distance3D(cube.vertices[0], cube.vertices[1]);
const rotatedEdgeLength = geometry.distance3D(rotatedCube.vertices[0], rotatedCube.vertices[1]);
assert.ok(Math.abs(originalEdgeLength - rotatedEdgeLength) < 1e-9, "rotation preserves edge length");

const sample = { x: 10, y: 20, z: 30 };
assert.deepEqual(projections.projectPoint(sample, "front"), { x: 10, y: 30 });
assert.deepEqual(projections.projectPoint(sample, "top"), { x: 10, y: 20 });
assert.deepEqual(projections.projectPoint(sample, "side"), { x: 20, y: 30 });
assert.equal(projections.formatMm(25.5), "25.5");
assert.equal(projections.formatMm(40), "40");

console.log("FOLE DraftLab checks passed: viewport transforms, cursor zoom, fit, solid topology, plane intersections, rotations and projections.");
