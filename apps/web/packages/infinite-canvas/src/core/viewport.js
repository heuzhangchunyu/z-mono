const MIN_SCALE = 0.3;
const MAX_SCALE = 4;
const ZOOM_STEP = 1.08;

export function clampScale(scale) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function createViewportLabel(position, scale) {
  return `origin (${Math.round(position.x)}, ${Math.round(position.y)}) • zoom ${Math.round(
    scale * 100
  )}%`;
}

export function getNextScale(currentScale, direction) {
  const nextScale = direction > 0 ? currentScale * ZOOM_STEP : currentScale / ZOOM_STEP;
  return clampScale(nextScale);
}

export function zoomAroundPoint(pointer, position, scale, nextScale) {
  const worldPoint = {
    x: (pointer.x - position.x) / scale,
    y: (pointer.y - position.y) / scale
  };

  return {
    x: pointer.x - worldPoint.x * nextScale,
    y: pointer.y - worldPoint.y * nextScale
  };
}
