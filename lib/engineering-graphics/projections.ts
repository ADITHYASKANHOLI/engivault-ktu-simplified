import type { ProjectionKind, Vec2, Vec3 } from "./types";

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

export function projectPoint(point: Vec3, kind: ProjectionKind): Vec2 {
  switch (kind) {
    case "front": return { x: point.x, y: point.z };
    case "top": return { x: point.x, y: point.y };
    case "side": return { x: point.y, y: point.z };
    case "isometric": return {
      x: (point.x - point.y) * COS30,
      y: point.z - (point.x + point.y) * SIN30,
    };
    default: return { x: point.x, y: point.z };
  }
}

export function projectedBounds(points: Vec2[]) {
  if (!points.length) return { minX: -1, minY: -1, maxX: 1, maxY: 1 };
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

export function formatMm(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
