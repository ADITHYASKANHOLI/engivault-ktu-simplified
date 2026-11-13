import type { Edge, Face, SolidGeometry, SolidSpec, Vec3 } from "./types";

const TAU = Math.PI * 2;

function edgeKey(a: number, b: number): string {
  return a < b ? a + ":" + b : b + ":" + a;
}

function uniqueEdges(faces: Face[]): Edge[] {
  const map = new Map<string, Edge>();
  for (const face of faces) {
    for (let i = 0; i < face.length; i += 1) {
      const a = face[i];
      const b = face[(i + 1) % face.length];
      map.set(edgeKey(a, b), [Math.min(a, b), Math.max(a, b)]);
    }
  }
  return Array.from(map.values());
}

function ring(radiusX: number, radiusY: number, z: number, count: number, offset = 0): Vec3[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * TAU + offset;
    return {
      x: Math.cos(angle) * radiusX,
      y: Math.sin(angle) * radiusY,
      z,
    };
  });
}

export function createSolidGeometry(spec: SolidSpec): SolidGeometry {
  const height = Math.max(0.001, spec.height);
  const base = Math.max(0.001, spec.base);
  const depth = Math.max(0.001, spec.depth);
  const sides = Math.max(3, Math.min(32, Math.round(spec.sides)));
  const segments = Math.max(12, Math.min(96, Math.round(spec.segments ?? 48)));

  if (spec.type === "cube" || spec.type === "cuboid") {
    const width = spec.type === "cube" ? base : base;
    const actualDepth = spec.type === "cube" ? base : depth;
    const actualHeight = spec.type === "cube" ? base : height;
    const x = width / 2;
    const y = actualDepth / 2;
    const z = actualHeight / 2;
    const vertices: Vec3[] = [
      { x: -x, y: -y, z: -z },
      { x, y: -y, z: -z },
      { x, y, z: -z },
      { x: -x, y, z: -z },
      { x: -x, y: -y, z },
      { x, y: -y, z },
      { x, y, z },
      { x: -x, y, z },
    ];
    const faces: Face[] = [
      [0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4],
      [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7],
    ];
    return { vertices, faces, edges: uniqueEdges(faces) };
  }

  const count = spec.type === "cylinder" || spec.type === "cone" ? segments : sides;
  const radiusX = base / 2;
  const radiusY = spec.type === "cylinder" || spec.type === "cone" ? base / 2 : base / 2;
  const lower = ring(radiusX, radiusY, 0, count, Math.PI / 2);
  const vertices: Vec3[] = [...lower];
  const faces: Face[] = [];

  if (spec.type === "pyramid" || spec.type === "cone") {
    const apexIndex = vertices.length;
    vertices.push({ x: 0, y: 0, z: height });
    faces.push(Array.from({ length: count }, (_, index) => count - 1 - index));
    for (let i = 0; i < count; i += 1) {
      faces.push([i, (i + 1) % count, apexIndex]);
    }
    return { vertices, faces, edges: uniqueEdges(faces) };
  }

  const upper = ring(radiusX, radiusY, height, count, Math.PI / 2);
  vertices.push(...upper);
  faces.push(Array.from({ length: count }, (_, index) => count - 1 - index));
  faces.push(Array.from({ length: count }, (_, index) => count + index));
  for (let i = 0; i < count; i += 1) {
    const next = (i + 1) % count;
    faces.push([i, next, count + next, count + i]);
  }
  return { vertices, faces, edges: uniqueEdges(faces) };
}

export function rotateGeometry(
  geometry: SolidGeometry,
  rotationXDegrees: number,
  rotationYDegrees: number,
  rotationZDegrees = 0
): SolidGeometry {
  const rx = (rotationXDegrees * Math.PI) / 180;
  const ry = (rotationYDegrees * Math.PI) / 180;
  const rz = (rotationZDegrees * Math.PI) / 180;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);

  const vertices = geometry.vertices.map((point) => {
    const x1 = point.x;
    const y1 = point.y * cx - point.z * sx;
    const z1 = point.y * sx + point.z * cx;

    const x2 = x1 * cy + z1 * sy;
    const y2 = y1;
    const z2 = -x1 * sy + z1 * cy;

    return {
      x: x2 * cz - y2 * sz,
      y: x2 * sz + y2 * cz,
      z: z2,
    };
  });

  return { vertices, edges: geometry.edges, faces: geometry.faces };
}

export function intersectGeometryWithPlane(
  geometry: SolidGeometry,
  normal: Vec3,
  offset: number,
  tolerance = 1e-7
): Vec3[] {
  const magnitude = Math.hypot(normal.x, normal.y, normal.z) || 1;
  const n = { x: normal.x / magnitude, y: normal.y / magnitude, z: normal.z / magnitude };
  const distance = (point: Vec3) => point.x * n.x + point.y * n.y + point.z * n.z - offset;
  const points: Vec3[] = [];

  const addUnique = (point: Vec3) => {
    if (!points.some((existing) =>
      Math.hypot(existing.x - point.x, existing.y - point.y, existing.z - point.z) < tolerance * 10
    )) points.push(point);
  };

  for (const [startIndex, endIndex] of geometry.edges) {
    const start = geometry.vertices[startIndex];
    const end = geometry.vertices[endIndex];
    const d1 = distance(start);
    const d2 = distance(end);

    if (Math.abs(d1) <= tolerance) addUnique(start);
    if (Math.abs(d2) <= tolerance) addUnique(end);

    if ((d1 < -tolerance && d2 > tolerance) || (d1 > tolerance && d2 < -tolerance)) {
      const t = d1 / (d1 - d2);
      addUnique({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        z: start.z + (end.z - start.z) * t,
      });
    }
  }

  if (points.length < 3) return points;

  const center = points.reduce(
    (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length, z: sum.z + point.z / points.length }),
    { x: 0, y: 0, z: 0 }
  );
  const reference = Math.abs(n.z) < 0.9 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 };
  const uRaw = {
    x: n.y * reference.z - n.z * reference.y,
    y: n.z * reference.x - n.x * reference.z,
    z: n.x * reference.y - n.y * reference.x,
  };
  const uLength = Math.hypot(uRaw.x, uRaw.y, uRaw.z) || 1;
  const u = { x: uRaw.x / uLength, y: uRaw.y / uLength, z: uRaw.z / uLength };
  const v = {
    x: n.y * u.z - n.z * u.y,
    y: n.z * u.x - n.x * u.z,
    z: n.x * u.y - n.y * u.x,
  };
  return points.sort((a, b) => {
    const ax = a.x - center.x, ay = a.y - center.y, az = a.z - center.z;
    const bx = b.x - center.x, by = b.y - center.y, bz = b.z - center.z;
    const angleA = Math.atan2(ax * v.x + ay * v.y + az * v.z, ax * u.x + ay * u.y + az * u.z);
    const angleB = Math.atan2(bx * v.x + by * v.y + bz * v.z, bx * u.x + by * u.y + bz * u.z);
    return angleA - angleB;
  });
}

export function distance3D(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function geometryBounds(geometry: SolidGeometry) {
  const xs = geometry.vertices.map((point) => point.x);
  const ys = geometry.vertices.map((point) => point.y);
  const zs = geometry.vertices.map((point) => point.z);
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
    minZ: Math.min(...zs), maxZ: Math.max(...zs),
  };
}
