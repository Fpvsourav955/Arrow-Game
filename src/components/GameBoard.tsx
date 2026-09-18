import React, { useRef, useState, useEffect } from 'react';
import { ArrowItem, LevelData } from '../types';
import { ArrowView } from './ArrowView';

interface GameBoardProps {
  level: LevelData;
  activeArrows: ArrowItem[];
  exitingArrowIds: Set<string>;
  blockedArrowId: string | null;
  hintedArrowId: string | null;
  onArrowTap: (arrow: ArrowItem) => void;
  disabled: boolean;
  theme?: 'clean' | 'warm';
}

export const GameBoard: React.FC<GameBoardProps> = ({
  level,
  activeArrows,
  exitingArrowIds,
  blockedArrowId,
  hintedArrowId,
  onArrowTap,
  disabled,
  theme = 'clean',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [boardWidth, setBoardWidth] = useState<number>(320);

  // Measure container and adapt cellSize
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Cap board size for comfortable portrait mobile presentation
      const available = Math.min(rect.width - 24, 460);
      setBoardWidth(Math.max(260, available));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const maxDimension = Math.max(level.rows, level.cols);
  const cellSize = Math.floor(boardWidth / maxDimension);
  const actualBoardWidth = cellSize * level.cols;
  const actualBoardHeight = cellSize * level.rows;

  return (
    <div
      ref={containerRef}
      className="w-full flex items-center justify-center p-2 my-auto select-none"
    >
      {/* Elevated Board Card */}
      <div
        id="puzzle-board"
        className={`relative rounded-3xl p-3 sm:p-4 shadow-xl border transition-all duration-300 ${
          theme === 'warm'
            ? 'bg-amber-50/60 border-amber-200/60 shadow-amber-900/5'
            : 'bg-white border-slate-200/80 shadow-slate-900/5'
        }`}
        style={{
          width: `${actualBoardWidth + 24}px`,
          height: `${actualBoardHeight + 24}px`,
        }}
      >
        {/* Subtle inner grid canvas / dot matrix */}
        <div
          className="relative w-full h-full overflow-visible rounded-2xl flex items-center justify-center"
          style={{
            width: `${actualBoardWidth}px`,
            height: `${actualBoardHeight}px`,
          }}
        >
          {/* Subtle Grid Dots */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: level.rows }).map((_, r) =>
              Array.from({ length: level.cols }).map((_, c) => (
                <div
                  key={`dot-${r}-${c}`}
                  className="absolute flex items-center justify-center pointer-events-none"
                  style={{
                    left: `${c * cellSize}px`,
                    top: `${r * cellSize}px`,
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200/70" />
                </div>
              ))
            )}
          </div>

          {/* Active & Exiting Arrows */}
          {activeArrows.map((arrow) => (
            <ArrowView
              key={arrow.id}
              arrow={arrow}
              cellSize={cellSize}
              isHinted={hintedArrowId === arrow.id}
              isBlocked={blockedArrowId === arrow.id}
              isExiting={exitingArrowIds.has(arrow.id)}
              onClick={() => onArrowTap(arrow)}
              disabled={disabled || exitingArrowIds.has(arrow.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
