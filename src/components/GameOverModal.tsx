import React from 'react';
import { RotateCcw, Grid, Lightbulb, HeartCrack } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  levelNumber: number;
  onRetry: () => void;
  onLevelSelect: () => void;
  onUseHintRetry: () => void;
  availableHints: number;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  levelNumber,
  onRetry,
  onLevelSelect,
  onUseHintRetry,
  availableHints,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center flex flex-col items-center">
        {/* Heartbreak icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-3 shadow-inner ring-4 ring-red-100/60">
          <HeartCrack className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Out of Lives
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">
          An arrow's path was blocked. Arrows can only fly away when no other arrow is in front of them!
        </p>

        {/* Tactical Tip */}
        <div className="w-full my-4 p-3 bg-amber-50/70 border border-amber-200/50 rounded-2xl text-left flex items-start gap-2.5">
          <div className="p-1 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">Tip:</span> Look along the outer edges for arrows pointing straight off the board to start your chain.
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            id="retry-level-button"
            onClick={onRetry}
            className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Try Again</span>
          </button>

          {availableHints > 0 && (
            <button
              id="retry-with-hint-button"
              onClick={onUseHintRetry}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-sm flex items-center justify-center gap-2 border border-amber-200/60 transition-all"
            >
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Retry with Hint ({availableHints} left)</span>
            </button>
          )}

          <button
            id="modal-level-select-button"
            onClick={onLevelSelect}
            className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-medium text-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <Grid className="w-4 h-4" />
            <span>Select Another Level</span>
          </button>
        </div>
      </div>
    </div>
  );
};
