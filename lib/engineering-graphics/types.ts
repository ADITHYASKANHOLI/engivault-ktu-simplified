export type Vec3 = { x: number; y: number; z: number };
export type Vec2 = { x: number; y: number };
export type Edge = [number, number];
export type Face = number[];

export type SolidType =
  | "prism"
  | "pyramid"
  | "cylinder"
  | "cone"
  | "cuboid"
  | "cube";

export type ProjectionKind = "front" | "top" | "side" | "isometric";

export interface SolidSpec {
  type: SolidType;
  base: number;
  depth: number;
  height: number;
  sides: number;
  segments?: number;
}

export interface SolidGeometry {
  vertices: Vec3[];
  edges: Edge[];
  faces: Face[];
}

export interface Bounds2D {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}
