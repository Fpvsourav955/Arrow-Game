import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  Heart,
  Lightbulb,
  RotateCcw,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Undo2,
  Sparkles,
} from 'lucide-react';
import { ArrowItem, LevelData, GameProgress, GameSettings } from '../types';
import { GameBoard } from './GameBoard';
import { LevelCompleteModal } from './LevelCompleteModal';
import { GameOverModal } from './GameOverModal';
import { isArrowPathClear, getFreeArrows } from '../utils/levelValidator';
import { soundEngine } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { recordLevelCompletion } from '../utils/storage';

interface GameScreenProps {
  level: LevelData;
  progress: GameProgress;
  settings: GameSettings;
  onBack: () => void;
  onNextLevel: (nextLevelNumber: number) => void;
  onOpenSettings: () => void;
  onUpdateProgress: (newProgress: GameProgress) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  level,
  progress,
  settings,
  onBack,
  onNextLevel,
  onOpenSettings,
  onUpdateProgress,
}) => {
  // Level State
  const [activeArrows, setActiveArrows] = useState<ArrowItem[]>([]);
  const [history, setHistory] = useState<ArrowItem[][]>([]);
  const [exitingArrowIds, setExitingArrowIds] = useState<Set<string>>(new Set());
  const [blockedArrowId, setBlockedArrowId] = useState<string | null>(null);
  const [hintedArrowId, setHintedArrowId] = useState<string | null>(null);
  const [lives, setLives] = useState<number>(3);
  const [moves, setMoves] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [completedStars, setCompletedStars] = useState<number>(3);
  const hintTimeoutRef = useRef<number | null>(null);

  // Initialize level
  const initLevel = useCallback((targetLevel: LevelData) => {
    setActiveArrows([...targetLevel.arrows]);
    setHistory([]);
    setExitingArrowIds(new Set());
    setBlockedArrowId(null);
    setHintedArrowId(null);
    setLives(targetLevel.startingLives ?? 3);
    setMoves(0);
    setIsCompleted(false);
    setIsGameOver(false);
  }, []);

  useEffect(() => {
    initLevel(level);
  }, [level, initLevel]);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        window.clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  // Handle Arrow Tap
  const handleArrowTap = (arrow: ArrowItem) => {
    if (isCompleted || isGameOver || exitingArrowIds.has(arrow.id)) {
      return;
    }

    // Dismiss hint if user tapped the hinted arrow or any other
    if (hintedArrowId) {
      setHintedArrowId(null);
    }

    const isClear = isArrowPathClear(arrow, activeArrows, level.rows, level.cols);

    if (isClear) {
      // Valid Move: Animate fly-out
      soundEngine.playLaunch();
      triggerHaptic('success', settings.vibrationEnabled);

      // Save state to undo history
      setHistory((prev) => [...prev, [...activeArrows]]);

      setExitingArrowIds((prev) => new Set(prev).add(arrow.id));
      setMoves((m) => m + 1);

      // Complete removal after animation ends
      setTimeout(() => {
        setActiveArrows((prev) => {
          const next = prev.filter((a) => a.id !== arrow.id);

          // Check if board is cleared
          if (next.length === 0) {
            const finalStars = Math.max(1, lives);
            setCompletedStars(finalStars);
            setIsCompleted(true);
            soundEngine.playWin();
            triggerHaptic('win', settings.vibrationEnabled);

            const updatedProgress = recordLevelCompletion(
              level.levelNumber,
              finalStars,
              moves + 1
            );
            onUpdateProgress(updatedProgress);
          }

          return next;
        });

        setExitingArrowIds((prev) => {
          const next = new Set(prev);
          next.delete(arrow.id);
          return next;
        });
      }, 340);
    } else {
      // Blocked Move: Error feedback & lose 1 heart
      soundEngine.playBlocked();
      triggerHaptic('error', settings.vibrationEnabled);
      setBlockedArrowId(arrow.id);

      setTimeout(() => {
        setBlockedArrowId(null);
      }, 320);

      setLives((currentLives) => {
        const nextLives = currentLives - 1;
        if (nextLives <= 0) {
          setIsGameOver(true);
          soundEngine.playLose();
        }
        return Math.max(0, nextLives);
      });
    }
  };

  // Hint Logic
  const handleUseHint = () => {
    if (isCompleted || isGameOver) return;

    const freeArrows = getFreeArrows(activeArrows, level.rows, level.cols);
    if (freeArrows.length === 0) return;

    // Pick first free arrow
    const target = freeArrows[0];
    soundEngine.playHint();
    triggerHaptic('tap', settings.vibrationEnabled);
    setHintedArrowId(target.id);

    // Auto-clear hint after 3.5s
    if (hintTimeoutRef.current) {
      window.clearTimeout(hintTimeoutRef.current);
    }
    hintTimeoutRef.current = window.setTimeout(() => {
      setHintedArrowId(null);
    }, 3500);
  };

  // Undo Move
  const handleUndo = () => {
    if (history.length === 0 || isCompleted || isGameOver) return;
    soundEngine.playTap();
    triggerHaptic('tap', settings.vibrationEnabled);

    const previousBoard = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setActiveArrows(previousBoard);
    setMoves((m) => Math.max(0, m - 1));
    setExitingArrowIds(new Set());
    setHintedArrowId(null);
  };

  // Restart Level
  const handleRestart = () => {
    soundEngine.playButtonClick();
    initLevel(level);
  };

  // Retry with Hint
  const handleRetryWithHint = () => {
    initLevel(level);
    setTimeout(() => {
      handleUseHint();
    }, 400);
  };

  // Next Level Handler
  const handleNextLevel = () => {
    soundEngine.playButtonClick();
    if (level.levelNumber < 50) {
      onNextLevel(level.levelNumber + 1);
    }
  };

  return (
    <div
      id="game-screen"
      className="flex flex-col h-full w-full max-w-md mx-auto bg-slate-50 border-x border-slate-200/60 shadow-lg relative overflow-hidden select-none"
    >
      {/* Header Bar */}
      <header className="p-3 sm:p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 shadow-2xs">
        <button
          id="game-back-button"
          onClick={() => {
            soundEngine.playButtonClick();
            onBack();
          }}
          className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
          title="Back to Levels"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-slate-900 tracking-tight">
              LEVEL {level.levelNumber}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-0.5">
            {level.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="game-settings-button"
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenSettings();
            }}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
            title="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hearts / Lives Sub-Header */}
      <div className="px-4 py-2.5 flex items-center justify-between bg-white/70 backdrop-blur-xs border-b border-slate-100 shrink-0">
        {/* Lives (3 Hearts) */}
        <div className="flex items-center gap-1.5" id="lives-container">
          {[1, 2, 3].map((heartIndex) => {
            const hasHeart = heartIndex <= lives;
            return (
              <div
                key={heartIndex}
                className={`transition-all duration-300 ${
                  hasHeart
                    ? 'text-rose-500 scale-100 drop-shadow-2xs animate-heart-beat'
                    : 'text-slate-200 scale-90'
                }`}
              >
                <Heart
                  className="w-6 h-6"
                  fill={hasHeart ? 'currentColor' : 'none'}
                  strokeWidth={hasHeart ? 1.5 : 2}
                />
              </div>
            );
          })}
        </div>

        {/* Moves & Remaining Arrows Tracker */}
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
            Moves: <strong className="text-slate-800">{moves}</strong>
          </span>
          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
            Remaining: <strong>{activeArrows.length}</strong>
          </span>
        </div>
      </div>

      {/* Main Game Board Area */}
      <main className="flex-1 flex items-center justify-center p-2 relative overflow-hidden">
        <GameBoard
          level={level}
          activeArrows={activeArrows}
          exitingArrowIds={exitingArrowIds}
          blockedArrowId={blockedArrowId}
          hintedArrowId={hintedArrowId}
          onArrowTap={handleArrowTap}
          disabled={isCompleted || isGameOver}
          theme={settings.boardTheme}
        />
      </main>

      {/* Bottom Action Controls */}
      <footer className="p-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
        <button
          id="undo-move-button"
          onClick={handleUndo}
          disabled={history.length === 0 || isCompleted || isGameOver}
          className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none active:scale-95 text-slate-700 transition-all flex flex-col items-center gap-1 min-w-[64px]"
          title="Undo Move"
        >
          <Undo2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Undo</span>
        </button>

        {/* Center Primary Hint Button */}
        <button
          id="use-hint-button"
          onClick={handleUseHint}
          disabled={isCompleted || isGameOver || activeArrows.length === 0}
          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
        >
          <Lightbulb className="w-5 h-5 text-amber-300" />
          <span>Hint</span>
        </button>

        <button
          id="restart-level-button"
          onClick={handleRestart}
          disabled={isCompleted}
          className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-all flex flex-col items-center gap-1 min-w-[64px]"
          title="Restart Level"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Restart</span>
        </button>
      </footer>

      {/* Level Complete Victory Modal */}
      <LevelCompleteModal
        isOpen={isCompleted}
        levelNumber={level.levelNumber}
        stars={completedStars}
        moves={moves}
        onNextLevel={handleNextLevel}
        onReplay={handleRestart}
        onLevelSelect={onBack}
        hasNextLevel={level.levelNumber < 50}
      />

      {/* Game Over / Out of Lives Modal */}
      <GameOverModal
        isOpen={isGameOver}
        levelNumber={level.levelNumber}
        onRetry={handleRestart}
        onLevelSelect={onBack}
        onUseHintRetry={handleRetryWithHint}
        availableHints={3}
      />
    </div>
  );
};
