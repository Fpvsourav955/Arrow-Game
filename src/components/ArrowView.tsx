import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ArrowItem, Direction, Point } from '../types';

interface ArrowViewProps {
  arrow: ArrowItem;
  cellSize: number;
  isHinted: boolean;
  isBlocked: boolean;
  isExiting: boolean;
  isRadarHighlighted?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const ArrowView: React.FC<ArrowViewProps> = ({
  arrow,
  cellSize,
  isHinted,
  isBlocked,
  isExiting,
  isRadarHighlighted = false,
  onClick,
  disabled,
}) => {
  const { points, direction } = arrow;
  const pathRef = useRef<SVGPathElement | null>(null);
  const [measuredLength, setMeasuredLength] = useState<number | null>(null);

  // Normalized points array
  const pts: Point[] = useMemo(() => {
    if (points && points.length > 0) return points;
    if (typeof arrow.row === 'number' && typeof arrow.col === 'number') {
      return [{ row: arrow.row, col: arrow.col }];
    }
    return [{ row: 0, col: 0 }];
  }, [points, arrow.row, arrow.col]);

  // Dimensions & Stroke Widths
  const strokeWidth = Math.max(5.5, Math.min(8.5, cellSize * 0.135));
  const arrowSpan = Math.max(16, cellSize * 0.46);
  const arrowLen = Math.max(12, cellSize * 0.32);
  const tipExtend = Math.max(6, cellSize * 0.16);
  const filletRadius = Math.max(8, cellSize * 0.32);

  // Exit travel distance for the slithering snake
  const travelDistance = Math.max(cellSize * 18, 900);

  // Direction unit vector
  const { dx, dy } = useMemo(() => {
    switch (direction) {
      case 'UP': return { dx: 0, dy: -1 };
      case 'DOWN': return { dx: 0, dy: 1 };
      case 'LEFT': return { dx: -1, dy: 0 };
      case 'RIGHT': return { dx: 1, dy: 0 };
    }
  }, [direction]);

  // Compute SVG paths and geometry
  const {
    baseBodySvg,
    extendedBodySvg,
    headSvg,
    headTip,
    analyticalLength,
  } = useMemo(() => {
    const pixelCoords = pts.map((p) => ({
      x: p.col * cellSize + cellSize / 2,
      y: p.row * cellSize + cellSize / 2,
    }));

    const lastIdx = pixelCoords.length - 1;
    const rawHead = pixelCoords[lastIdx];

    // Compute head tip position
    let tipX = rawHead.x + dx * tipExtend;
    let tipY = rawHead.y + dy * tipExtend;

    let leftWingX = tipX;
    let leftWingY = tipY;
    let rightWingX = tipX;
    let rightWingY = tipY;

    switch (direction) {
      case 'UP':
        leftWingX = tipX - arrowSpan / 2;
        leftWingY = tipY + arrowLen;
        rightWingX = tipX + arrowSpan / 2;
        rightWingY = tipY + arrowLen;
        break;
      case 'DOWN':
        leftWingX = tipX - arrowSpan / 2;
        leftWingY = tipY - arrowLen;
        rightWingX = tipX + arrowSpan / 2;
        rightWingY = tipY - arrowLen;
        break;
      case 'LEFT':
        leftWingX = tipX + arrowLen;
        leftWingY = tipY - arrowSpan / 2;
        rightWingX = tipX + arrowLen;
        rightWingY = tipY + arrowSpan / 2;
        break;
      case 'RIGHT':
        leftWingX = tipX - arrowLen;
        leftWingY = tipY - arrowSpan / 2;
        rightWingX = tipX - arrowLen;
        rightWingY = tipY + arrowSpan / 2;
        break;
    }

    const chevronSvg = `M ${leftWingX} ${leftWingY} L ${tipX} ${tipY} L ${rightWingX} ${rightWingY}`;

    // Construct body path with rounded fillet bends
    let bodySvg = '';
    let approxLen = 0;

    if (pixelCoords.length === 1) {
      // Single-node arrow
      const startX = rawHead.x - dx * (cellSize * 0.3);
      const startY = rawHead.y - dy * (cellSize * 0.3);
      bodySvg = `M ${startX} ${startY} L ${tipX} ${tipY}`;
      approxLen = cellSize * 0.3 + tipExtend;
    } else {
      // Multi-node arrow: build path from tail to head
      bodySvg = `M ${pixelCoords[0].x} ${pixelCoords[0].y}`;

      for (let i = 0; i < pixelCoords.length - 1; i++) {
        approxLen += Math.hypot(
          pixelCoords[i + 1].x - pixelCoords[i].x,
          pixelCoords[i + 1].y - pixelCoords[i].y
        );
      }
      approxLen += tipExtend;

      for (let i = 1; i < lastIdx; i++) {
        const prev = pixelCoords[i - 1];
        const cur = pixelCoords[i];
        const next = pixelCoords[i + 1];

        const dPrev = Math.hypot(cur.x - prev.x, cur.y - prev.y);
        const dNext = Math.hypot(next.x - cur.x, next.y - cur.y);
        const r = Math.min(filletRadius, dPrev / 2, dNext / 2);

        // Deduct corner arc difference
        approxLen -= (2 - Math.PI / 2) * r;

        const vInX = (cur.x - prev.x) / dPrev;
        const vInY = (cur.y - prev.y) / dPrev;
        const vOutX = (next.x - cur.x) / dNext;
        const vOutY = (next.y - cur.y) / dNext;

        const startCurveX = cur.x - vInX * r;
        const startCurveY = cur.y - vInY * r;
        const endCurveX = cur.x + vOutX * r;
        const endCurveY = cur.y + vOutY * r;

        bodySvg += ` L ${startCurveX} ${startCurveY} Q ${cur.x} ${cur.y} ${endCurveX} ${endCurveY}`;
      }

      bodySvg += ` L ${tipX} ${tipY}`;
    }

    // Extended trajectory for snake slither
    const exitX = tipX + dx * travelDistance;
    const exitY = tipY + dy * travelDistance;
    const extendedSvg = `${bodySvg} L ${exitX} ${exitY}`;

    return {
      baseBodySvg: bodySvg,
      extendedBodySvg: extendedSvg,
      headSvg: chevronSvg,
      headTip: { x: tipX, y: tipY },
      analyticalLength: approxLen,
    };
  }, [pts, direction, cellSize, dx, dy, strokeWidth, arrowSpan, arrowLen, tipExtend, filletRadius, travelDistance]);

  // Measure rendered path length for 100% precision
  useEffect(() => {
    if (pathRef.current) {
      try {
        const len = pathRef.current.getTotalLength();
        if (len > 0) {
          setMeasuredLength(len);
        }
      } catch {
        // Fallback to analytical length
      }
    }
  }, [baseBodySvg]);

  const bodyLength = measuredLength ?? analyticalLength;
  const exitSlide = travelDistance + bodyLength;

  // Colors
  let strokeColor = '#0B1B3D';
  if (isExiting) {
    strokeColor = '#2563EB';
  } else if (isHinted) {
    strokeColor = '#2563EB';
  } else if (isBlocked) {
    strokeColor = '#EF4444';
  } else if (isRadarHighlighted) {
    strokeColor = '#0284C7';
  }

  // Common timing for synchronized snake slithering
  const transitionTiming = '460ms cubic-bezier(0.2, 0.85, 0.25, 1)';

  return (
    <svg
      id={`arrow-svg-${arrow.id}`}
      className={`absolute inset-0 w-full h-full overflow-visible pointer-events-none select-none ${
        isBlocked ? 'animate-shake' : ''
      }`}
      style={{
        zIndex: isExiting ? 50 : isHinted ? 35 : isRadarHighlighted ? 25 : isBlocked ? 30 : 10,
        opacity: isExiting ? 0 : 1,
        transition: isExiting
          ? `opacity 400ms ease-in 100ms`
          : undefined,
      }}
    >
      {/* Hidden path used solely to measure exact rendered length before exit */}
      <path
        ref={pathRef}
        d={baseBodySvg}
        fill="none"
        stroke="none"
        pointerEvents="none"
      />

      <g
        id={`arrow-group-${arrow.id}`}
        onClick={disabled || isExiting ? undefined : onClick}
        className="pointer-events-auto cursor-pointer group"
        style={{
          filter: isExiting
            ? 'drop-shadow(0 0 10px rgba(37, 99, 235, 0.8))'
            : isHinted
            ? 'drop-shadow(0 0 10px rgba(37, 99, 235, 0.65))'
            : isRadarHighlighted
            ? 'drop-shadow(0 0 8px rgba(2, 132, 199, 0.7))'
            : isBlocked
            ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
            : undefined,
        }}
      >
        {/* Generous touch/click hit area along the arrow */}
        <path
          d={baseBodySvg}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(38, cellSize * 0.8)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={headSvg}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(38, cellSize * 0.8)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Outer glowing halo when Hinted */}
        {isHinted && (
          <>
            <path
              d={baseBodySvg}
              fill="none"
              stroke="#93C5FD"
              strokeWidth={strokeWidth + 10}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
              className="animate-pulse"
            />
            <path
              d={headSvg}
              fill="none"
              stroke="#93C5FD"
              strokeWidth={strokeWidth + 10}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
              className="animate-pulse"
            />
          </>
        )}

        {/* Radar Highlight Glow (from # tool) */}
        {isRadarHighlighted && !isHinted && !isExiting && (
          <>
            <path
              d={baseBodySvg}
              fill="none"
              stroke="#BAE6FD"
              strokeWidth={strokeWidth + 8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
              className="animate-pulse"
            />
            <path
              d={headSvg}
              fill="none"
              stroke="#BAE6FD"
              strokeWidth={strokeWidth + 8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
              className="animate-pulse"
            />
          </>
        )}

        {/* Error halo when Blocked */}
        {isBlocked && (
          <>
            <path
              d={baseBodySvg}
              fill="none"
              stroke="#FCA5A5"
              strokeWidth={strokeWidth + 8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
            <path
              d={headSvg}
              fill="none"
              stroke="#FCA5A5"
              strokeWidth={strokeWidth + 8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          </>
        )}

        {/* Slithering Snake Body Path */}
        <path
          d={extendedBodySvg}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${bodyLength} ${bodyLength + travelDistance + 2000}`}
          strokeDashoffset={isExiting ? exitSlide : 0}
          style={{
            transition: isExiting
              ? `stroke-dashoffset ${transitionTiming}, stroke 150ms ease`
              : 'stroke-dashoffset 0ms, stroke 150ms ease',
          }}
          className="group-hover:opacity-90 transition-opacity"
        />

        {/* Synchronized Arrowhead Chevron */}
        <path
          d={headSvg}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isExiting
              ? `translate(${dx * exitSlide}px, ${dy * exitSlide}px)`
              : 'none',
            transition: isExiting
              ? `transform ${transitionTiming}, stroke 150ms ease`
              : 'transform 0ms, stroke 150ms ease',
          }}
          className="group-hover:opacity-90 transition-opacity"
        />

        {/* Hint forward pulsing circle */}
        {isHinted && (
          <circle
            cx={headTip.x}
            cy={headTip.y}
            r={strokeWidth * 0.9}
            fill="#3B82F6"
            className="animate-ping"
            opacity="0.6"
          />
        )}
      </g>
    </svg>
  );
};
