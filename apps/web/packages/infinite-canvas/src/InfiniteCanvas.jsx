import { Group, Layer, Line, Rect, Stage, Text } from 'react-konva';
import { DEFAULT_CANVAS_MESSAGE, DEFAULT_CANVAS_TITLE } from './utils/constants.js';
import { useInfiniteCanvas } from './hooks/useInfiniteCanvas.js';

export default function InfiniteCanvas({
  title = DEFAULT_CANVAS_TITLE,
  message = DEFAULT_CANVAS_MESSAGE
}) {
  const {
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    position,
    scale,
    stageHeight,
    stageWidth,
    viewportLabel
  } = useInfiniteCanvas();

  const gridLines = [];
  const gridSize = 40;
  const halfWidth = 2400;
  const halfHeight = 2400;

  for (let x = -halfWidth; x <= halfWidth; x += gridSize) {
    gridLines.push(
      <Line
        key={`vertical-${x}`}
        points={[x, -halfHeight, x, halfHeight]}
        stroke={x === 0 ? '#c2410c' : 'rgba(148, 163, 184, 0.25)'}
        strokeWidth={x === 0 ? 2 : 1}
        listening={false}
      />
    );
  }

  for (let y = -halfHeight; y <= halfHeight; y += gridSize) {
    gridLines.push(
      <Line
        key={`horizontal-${y}`}
        points={[-halfWidth, y, halfWidth, y]}
        stroke={y === 0 ? '#c2410c' : 'rgba(148, 163, 184, 0.25)'}
        strokeWidth={y === 0 ? 2 : 1}
        listening={false}
      />
    );
  }

  return (
    <section className="infinite-canvas">
      <div className="infinite-canvas__toolbar">
        <div>
          <p className="infinite-canvas__eyebrow">infinite canvas package</p>
          <h2>{title}</h2>
        </div>
        <span className="infinite-canvas__badge">{viewportLabel}</span>
      </div>

      <div className="infinite-canvas__stage" ref={containerRef}>
        <div className="infinite-canvas__hint">
          Drag to pan. Scroll to zoom.
        </div>

        {stageWidth > 0 && (
          <Stage
            width={stageWidth}
            height={stageHeight}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onWheel={handleWheel}
          >
            <Layer>
              <Group x={position.x} y={position.y} scaleX={scale} scaleY={scale}>
                <Rect
                  x={-halfWidth}
                  y={-halfHeight}
                  width={halfWidth * 2}
                  height={halfHeight * 2}
                  fill="rgba(0, 0, 0, 0.001)"
                />
                {gridLines}
              </Group>
            </Layer>

            <Layer>
              <Group x={position.x} y={position.y} scaleX={scale} scaleY={scale}>
                <Rect
                  x={-120}
                  y={-80}
                  width={240}
                  height={160}
                  cornerRadius={24}
                  fill="#f8fafc"
                  stroke="#d97706"
                  strokeWidth={3}
                  shadowColor="rgba(15, 23, 42, 0.12)"
                  shadowBlur={18}
                  shadowOffsetY={8}
                />
                <Text
                  x={-88}
                  y={-28}
                  width={176}
                  align="center"
                  text={title}
                  fontSize={24}
                  fontStyle="bold"
                  fill="#0f172a"
                />
                <Text
                  x={-136}
                  y={20}
                  width={272}
                  align="center"
                  text={message}
                  fontSize={14}
                  lineHeight={1.5}
                  fill="#475569"
                />
              </Group>
            </Layer>
          </Stage>
        )}
      </div>
    </section>
  );
}
