import type { Bounds2D, Vec2, ViewportState } from "./types";

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 30;

export function worldToScreen(
  point: Vec2,
  viewport: ViewportState,
  width: number,
  height: number
): Vec2 {
  return {
    x: width / 2 + viewport.panX + point.x * viewport.zoom,
    y: height / 2 + viewport.panY - point.y * viewport.zoom,
  };
}

export function screenToWorld(
  point: Vec2,
  viewport: ViewportState,
  width: number,
  height: number
): Vec2 {
  return {
    x: (point.x - width / 2 - viewport.panX) / viewport.zoom,
    y: -(point.y - height / 2 - viewport.panY) / viewport.zoom,
  };
}

export function zoomAt(
  viewport: ViewportState,
  cursor: Vec2,
  factor: number,
  width: number,
  height: number
): ViewportState {
  const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.zoom * factor));
  const ratio = nextZoom / viewport.zoom;
  const centerX = width / 2;
  const centerY = height / 2;
  const nextPanX = cursor.x - centerX - (cursor.x - centerX - viewport.panX) * ratio;
  const nextPanY = cursor.y - centerY - (cursor.y - centerY - viewport.panY) * ratio;
  return { zoom: nextZoom, panX: nextPanX, panY: nextPanY };
}

export function fitBounds(
  bounds: Bounds2D,
  width: number,
  height: number,
  padding = 76
): ViewportState {
  const spanX = Math.max(1, bounds.maxX - bounds.minX);
  const spanY = Math.max(1, bounds.maxY - bounds.minY);
  const zoom = Math.max(
    MIN_ZOOM,
    Math.min(MAX_ZOOM, Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY))
  );
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  return { zoom, panX: -centerX * zoom, panY: centerY * zoom };
}

export function panBy(viewport: ViewportState, dx: number, dy: number): ViewportState {
  return { ...viewport, panX: viewport.panX + dx, panY: viewport.panY + dy };
}

export function zoomLabel(zoom: number): string {
  return Math.round(zoom * 100) + "%";
}
