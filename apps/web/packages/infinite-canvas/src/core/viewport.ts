import type { Vector2d } from 'konva/lib/types.js';

const MIN_SCALE = 0.3;
const MAX_SCALE = 4;
const ZOOM_STEP = 1.08;

export function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function createViewportLabel(position: Vector2d, scale: number) {
  return `origin (${Math.round(position.x)}, ${Math.round(position.y)}) • zoom ${Math.round(
    scale * 100
  )}%`;
}

export function getNextScale(currentScale: number, direction: number) {
  const nextScale = direction > 0 ? currentScale * ZOOM_STEP : currentScale / ZOOM_STEP;
  return clampScale(nextScale);
}

export function zoomAroundPoint(
  pointer: Vector2d,
  position: Vector2d,
  scale: number,
  nextScale: number
) {
  const worldPoint = {
    x: (pointer.x - position.x) / scale,
    y: (pointer.y - position.y) / scale
  };

  return {
    x: pointer.x - worldPoint.x * nextScale,
    y: pointer.y - worldPoint.y * nextScale
  };
}
