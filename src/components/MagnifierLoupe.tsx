import React from 'react';
import { ArrowItem, LevelData } from '../types';
import { ArrowView } from './ArrowView';

interface MagnifierLoupeProps {
  level: LevelData;
  activeArrows: ArrowItem[];
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  pointerPos: { x: number; y: number } | null;
  onArrowTap: (arrow: ArrowItem) => void;
  hintedArrowId: string | null;
  blockedArrowId: string | null;
  radarArrowIds: Set<string>;
  zoomScale?: number;
  loupeSize?: number;
}

export const MagnifierLoupe: React.FC<MagnifierLoupeProps> = ({
  level,
  activeArrows,
  cellSize,
  boardWidth,
  boardHeight,
  pointerPos,
  onArrowTap,
  hintedArrowId,
  blockedArrowId,
  radarArrowIds,
  zoomScale = 2.0,
  loupeSize = 140,
}) => {
  if (!pointerPos) return null;

  // Clamp pointer within board boundaries
  const px = Math.max(0, Math.min(boardWidth, pointerPos.x));
  const py = Math.max(0, Math.min(boardHeight, pointerPos.y));

  // Offset the magnified view so the point under the loupe is centered
  const innerOffsetX = loupeSize / 2 - px * zoomScale;
  const innerOffsetY = loupeSize / 2 - py * zoomScale;

  return (
    <div
      id="magnifier-loupe-container"
      className="absolute pointer-events-none z-50 transition-transform duration-75 ease-out"
      style={{
        left: `${px - loupeSize / 2}px`,
        top: `${py - loupeSize / 2 - 20}px`, // Slight upward offset so user's finger/cursor doesn't obscure the center
        width: `${loupeSize}px`,
        height: `${loupeSize}px`,
      }}
    >
      {/* Outer Loupe Frame with metallic/glass shadow */}
      <div className="relative w-full h-full rounded-full border-3 border-blue-500 bg-white/95 shadow-2xl overflow-hidden backdrop-blur-md ring-4 ring-blue-500/20">
        {/* Scaled Board Canvas */}
        <div
          className="absolute"
          style={{
            width: `${boardWidth}px`,
            height: `${boardHeight}px`,
            transform: `translate(${innerOffsetX}px, ${innerOffsetY}px) scale(${zoomScale})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Scaled grid dots */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: level.rows }).map((_, r) =>
              Array.from({ length: level.cols }).map((_, c) => (
                <div
                  key={`mag-dot-${r}-${c}`}
                  className="absolute flex items-center justify-center pointer-events-none"
                  style={{
                    left: `${c * cellSize}px`,
                    top: `${r * cellSize}px`,
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                </div>
              ))
            )}
          </div>

          {/* Scaled arrows */}
          {activeArrows.map((arrow) => (
            <ArrowView
              key={`mag-${arrow.id}`}
              arrow={arrow}
              cellSize={cellSize}
              isHinted={hintedArrowId === arrow.id}
              isBlocked={blockedArrowId === arrow.id}
              isExiting={false}
              isRadarHighlighted={radarArrowIds.has(arrow.id)}
              onClick={() => onArrowTap(arrow)}
              disabled={false}
            />
          ))}
        </div>

        {/* Loupe Crosshair / Reticle */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border border-blue-500/50 bg-blue-500/10" />
          <div className="absolute w-2 h-0.5 bg-blue-500/60 -left-1" />
          <div className="absolute w-2 h-0.5 bg-blue-500/60 -right-1" />
          <div className="absolute h-2 w-0.5 bg-blue-500/60 -top-1" />
          <div className="absolute h-2 w-0.5 bg-blue-500/60 -bottom-1" />
        </div>

        {/* Loupe Glass Glare Reflection */}
        <div className="absolute -inset-2 bg-gradient-to-tr from-transparent via-white/20 to-white/40 pointer-events-none rounded-full" />
      </div>

      {/* Mini zoom badge */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-md">
        2.0x
      </div>
    </div>
  );
};
