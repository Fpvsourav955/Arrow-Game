import React, { useMemo } from 'react';
import { ArrowItem, Direction, Point } from '../types';

interface ArrowViewProps {
  arrow: ArrowItem;
  cellSize: number;
  isHinted: boolean;
  isBlocked: boolean;
  isExiting: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const ArrowView: React.FC<ArrowViewProps> = ({
  arrow,
  cellSize,
  isHinted,
  isBlocked,
  isExiting,
  onClick,
  disabled,
}) => {
  const { points, direction } = arrow;

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

  // Compute SVG paths for body and head
  const { bodyPath, headPath, headTip } = useMemo(() => {
    // Convert grid points to pixel centers
    const pixelCoords = pts.map((p) => ({
      x: p.col * cellSize + cellSize / 2,
      y: p.row * cellSize + cellSize / 2,
    }));

    const lastIdx = pixelCoords.length - 1;
    const rawHead = pixelCoords[lastIdx];

    // Compute head tip position by extending slightly forward in direction
    let tipX = rawHead.x;
    let tipY = rawHead.y;
    let leftWingX = rawHead.x;
    let leftWingY = rawHead.y;
    let rightWingX = rawHead.x;
    let rightWingY = rawHead.y;

    switch (direction) {
      case 'UP':
        tipY = rawHead.y - tipExtend;
        leftWingX = tipX - arrowSpan / 2;
        leftWingY = tipY + arrowLen;
        rightWingX = tipX + arrowSpan / 2;
        rightWingY = tipY + arrowLen;
        break;
      case 'DOWN':
        tipY = rawHead.y + tipExtend;
        leftWingX = tipX - arrowSpan / 2;
        leftWingY = tipY - arrowLen;
        rightWingX = tipX + arrowSpan / 2;
        rightWingY = tipY - arrowLen;
        break;
      case 'LEFT':
        tipX = rawHead.x - tipExtend;
        leftWingX = tipX + arrowLen;
        leftWingY = tipY - arrowSpan / 2;
        rightWingX = tipX + arrowLen;
        rightWingY = tipY + arrowSpan / 2;
        break;
      case 'RIGHT':
        tipX = rawHead.x + tipExtend;
        leftWingX = tipX - arrowLen;
        leftWingY = tipY - arrowSpan / 2;
        rightWingX = tipX - arrowLen;
        rightWingY = tipY + arrowSpan / 2;
        break;
    }

    const headSvg = `M ${leftWingX} ${leftWingY} L ${tipX} ${tipY} L ${rightWingX} ${rightWingY}`;

    // Construct body path with rounded fillet bends
    let bodySvg = '';
    if (pixelCoords.length === 1) {
      // Single node arrow
      const startX =
        direction === 'LEFT'
          ? rawHead.x + cellSize * 0.3
          : direction === 'RIGHT'
          ? rawHead.x - cellSize * 0.3
          : rawHead.x;
      const startY =
        direction === 'UP'
          ? rawHead.y + cellSize * 0.3
          : direction === 'DOWN'
          ? rawHead.y - cellSize * 0.3
          : rawHead.y;
      bodySvg = `M ${startX} ${startY} L ${tipX} ${tipY}`;
    } else {
      // Multi-node arrow: build path from tail to head
      bodySvg = `M ${pixelCoords[0].x} ${pixelCoords[0].y}`;

      for (let i = 1; i < lastIdx; i++) {
        const prev = pixelCoords[i - 1];
        const cur = pixelCoords[i];
        const next = pixelCoords[i + 1];

        const dPrev = Math.hypot(cur.x - prev.x, cur.y - prev.y);
        const dNext = Math.hypot(next.x - cur.x, next.y - cur.y);
        const r = Math.min(filletRadius, dPrev / 2, dNext / 2);

        // Vector in and out
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

      // Connect to the tip of the arrowhead
      bodySvg += ` L ${tipX} ${tipY}`;
    }

    return {
      bodyPath: bodySvg,
      headPath: headSvg,
      headTip: { x: tipX, y: tipY },
    };
  }, [pts, direction, cellSize, strokeWidth, arrowSpan, arrowLen, tipExtend, filletRadius]);

  // Calculate exit flyout translation vector
  let flyX = 0;
  let flyY = 0;
  if (isExiting) {
    const travelDistance = Math.max(cellSize * 14, 750);
    switch (direction) {
      case 'UP':
        flyY = -travelDistance;
        break;
      case 'DOWN':
        flyY = travelDistance;
        break;
      case 'LEFT':
        flyX = -travelDistance;
        break;
      case 'RIGHT':
        flyX = travelDistance;
        break;
    }
  }

  // Dynamic colors matching image.png
  // Default: deep navy (#0B1B3D)
  // Hinted: vibrant royal blue (#2563EB) with glowing light blue halo (#60A5FA)
  // Blocked: warning crimson (#EF4444)
  // Exiting: electric blue (#3B82F6)
  let strokeColor = '#0B1B3D';
  if (isHinted) {
    strokeColor = '#2563EB';
  } else if (isBlocked) {
    strokeColor = '#EF4444';
  } else if (isExiting) {
    strokeColor = '#2563EB';
  }

  return (
    <svg
      id={`arrow-svg-${arrow.id}`}
      className={`absolute inset-0 w-full h-full overflow-visible pointer-events-none select-none ${
        isBlocked ? 'animate-shake' : ''
      }`}
      style={{
        transform: isExiting
          ? `translate(${flyX}px, ${flyY}px)`
          : undefined,
        opacity: isExiting ? 0 : 1,
        transition: isExiting
          ? 'transform 420ms cubic-bezier(0.16, 0, 0.2, 1), opacity 400ms ease-in'
          : 'transform 180ms ease-out',
        zIndex: isExiting ? 45 : isHinted ? 35 : isBlocked ? 30 : 10,
      }}
    >
      <g
        id={`arrow-group-${arrow.id}`}
        onClick={disabled || isExiting ? undefined : onClick}
        className="pointer-events-auto cursor-pointer group"
        style={{
          filter: isHinted
            ? 'drop-shadow(0 0 10px rgba(37, 99, 235, 0.65))'
            : isBlocked
            ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
            : undefined,
        }}
      >
        {/* Generous invisible touch/click hit area along the entire arrow body */}
        <path
          d={bodyPath}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(38, cellSize * 0.8)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={headPath}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(38, cellSize * 0.8)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Outer glowing halo when Hinted (Level 239 style) */}
        {isHinted && (
          <>
            <path
              d={bodyPath}
              fill="none"
              stroke="#93C5FD"
              strokeWidth={strokeWidth + 10}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.75"
              className="animate-pulse"
            />
            <path
              d={headPath}
              fill="none"
              stroke="#93C5FD"
              strokeWidth={strokeWidth + 10}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.75"
              className="animate-pulse"
            />
          </>
        )}

        {/* Outer error halo when Blocked */}
        {isBlocked && (
          <>
            <path
              d={bodyPath}
              fill="none"
              stroke="#FCA5A5"
              strokeWidth={strokeWidth + 8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
            <path
              d={headPath}
              fill="none"
              stroke="#FCA5A5"
              strokeWidth={strokeWidth + 8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          </>
        )}

        {/* Main Body Pipe Path with rounded bends */}
        <path
          d={bodyPath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 150ms ease' }}
          className="group-hover:opacity-90 transition-opacity"
        />

        {/* Arrowhead Chevron */}
        <path
          d={headPath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 150ms ease' }}
          className="group-hover:opacity-90 transition-opacity"
        />

        {/* Hint subtle forward indicator ripple */}
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
