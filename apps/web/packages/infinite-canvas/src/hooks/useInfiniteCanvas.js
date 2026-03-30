import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createViewportLabel,
  getNextScale,
  zoomAroundPoint
} from '../core/viewport.js';

const DEFAULT_STAGE_HEIGHT = 420;

export function useInfiniteCanvas() {
  const containerRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const panStartRef = useRef({
    pointer: { x: 0, y: 0 },
    position: { x: 0, y: 0 }
  });
  const hasCenteredRef = useRef(false);
  const [stageSize, setStageSize] = useState({
    width: 0,
    height: DEFAULT_STAGE_HEIGHT
  });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return undefined;
    }

    const updateSize = () => {
      const nextWidth = element.clientWidth;
      const nextHeight = DEFAULT_STAGE_HEIGHT;

      setStageSize({
        width: nextWidth,
        height: nextHeight
      });

      if (!hasCenteredRef.current && nextWidth > 0) {
        setPosition({
          x: nextWidth / 2,
          y: nextHeight / 2
        });
        hasCenteredRef.current = true;
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const viewportLabel = useMemo(
    () => createViewportLabel(position, scale),
    [position, scale]
  );

  const handlePointerDown = (event) => {
    const pointer = event.target.getStage()?.getPointerPosition();

    if (!pointer) {
      return;
    }

    isPointerDownRef.current = true;
    panStartRef.current = {
      pointer,
      position
    };
  };

  const handlePointerMove = (event) => {
    if (!isPointerDownRef.current) {
      return;
    }

    const pointer = event.target.getStage()?.getPointerPosition();

    if (!pointer) {
      return;
    }

    const { pointer: startPointer, position: startPosition } = panStartRef.current;

    setPosition({
      x: startPosition.x + (pointer.x - startPointer.x),
      y: startPosition.y + (pointer.y - startPointer.y)
    });
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  const handleWheel = (event) => {
    event.evt.preventDefault();

    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();

    if (!pointer) {
      return;
    }

    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const nextScale = getNextScale(scale, direction);

    if (nextScale === scale) {
      return;
    }

    const nextPosition = zoomAroundPoint(pointer, position, scale, nextScale);
    setScale(nextScale);
    setPosition(nextPosition);
  };

  return {
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    position,
    scale,
    stageHeight: stageSize.height,
    stageWidth: stageSize.width,
    viewportLabel,
    handleWheel
  };
}
