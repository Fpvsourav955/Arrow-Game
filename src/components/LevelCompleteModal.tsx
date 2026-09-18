import React from 'react';
import { Trophy, Star, RotateCcw, ArrowRight, Grid } from 'lucide-react';
import { Confetti } from './Confetti';

interface LevelCompleteModalProps {
  isOpen: boolean;
  levelNumber: number;
  stars: number;
  moves: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onLevelSelect: () => void;
  hasNextLevel: boolean;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  isOpen,
  levelNumber,
  stars,
  moves,
  onNextLevel,
  onReplay,
  onLevelSelect,
  hasNextLevel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="level-complete-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <Confetti active={isOpen} />

      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center flex flex-col items-center">
        {/* Celebration Trophy Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3 shadow-inner ring-4 ring-amber-100/60">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Level {levelNumber} Cleared!
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Board solved in <span className="font-semibold text-slate-700">{moves} moves</span>
        </p>

        {/* 3-Star Rating Display */}
        <div className="flex items-center justify-center gap-2 my-5">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`transition-all duration-300 transform ${
                starIdx <= stars
                  ? 'text-amber-400 scale-110 drop-shadow-sm'
                  : 'text-slate-200 scale-95'
              }`}
            >
              <Star
                className="w-9 h-9"
                fill={starIdx <= stars ? 'currentColor' : 'none'}
                strokeWidth={starIdx <= stars ? 1.5 : 2}
              />
            </div>
          ))}
        </div>

        {/* Stars comment */}
        <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full mb-6">
          {stars === 3
            ? '★ ★ ★ Perfect! All 3 Hearts Kept'
            : stars === 2
            ? '★ ★ Great Job! 2 Hearts Kept'
            : '★ Completed! 1 Heart Kept'}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {hasNextLevel ? (
            <button
              id="next-level-button"
              onClick={onNextLevel}
              className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
            >
              <span>Next Level</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="text-sm font-semibold text-emerald-600 py-2">
              🎉 Congratulations! You have completed all 50 levels!
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button
              id="replay-button"
              onClick={onReplay}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-medium text-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay</span>
            </button>

            <button
              id="levels-button"
              onClick={onLevelSelect}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-medium text-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <Grid className="w-4 h-4" />
              <span>Levels</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
