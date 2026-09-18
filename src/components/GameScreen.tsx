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
  Search,
  Hash,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ArrowItem, LevelData, GameProgress, GameSettings } from '../types';
import { GameBoard } from './GameBoard';
import { SparkleBurst } from './LaunchSparkles';
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
  onUpdateSettings?: (newSettings: GameSettings) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  level,
  settings,
  onBack,
  onNextLevel,
  onOpenSettings,
  onUpdateProgress,
  onUpdateSettings,
}) => {
  // Level State
  const [activeArrows, setActiveArrows] = useState<ArrowItem[]>([]);
  const [initialTotalArrows, setInitialTotalArrows] = useState<number>(level.arrows.length);
  const [history, setHistory] = useState<ArrowItem[][]>([]);
  const [exitingArrowIds, setExitingArrowIds] = useState<Set<string>>(new Set());
  const [blockedArrowId, setBlockedArrowId] = useState<string | null>(null);
  const [hintedArrowId, setHintedArrowId] = useState<string | null>(null);
  const [radarArrowIds, setRadarArrowIds] = useState<Set<string>>(new Set());
  const [radarCharges, setRadarCharges] = useState<number>(3);
  const [isMagnifierActive, setIsMagnifierActive] = useState<boolean>(false);
  const [sparkleBursts, setSparkleBursts] = useState<SparkleBurst[]>([]);

  // Combo & Streak
  const [comboCount, setComboCount] = useState<number>(0);
  const [comboBanner, setComboBanner] = useState<{ text: string; count: number } | null>(null);
  const lastLaunchTimeRef = useRef<number>(0);
  const comboTimeoutRef = useRef<number | null>(null);

  // Lives, Moves, Timer
  const [lives, setLives] = useState<number>(3);
  const [moves, setMoves] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [completedStars, setCompletedStars] = useState<number>(3);

  const hintTimeoutRef = useRef<number | null>(null);
  const radarTimeoutRef = useRef<number | null>(null);

  // Initialize level
  const initLevel = useCallback((targetLevel: LevelData) => {
    setActiveArrows([...targetLevel.arrows]);
    setInitialTotalArrows(targetLevel.arrows.length);
    setHistory([]);
    setExitingArrowIds(new Set());
    setBlockedArrowId(null);
    setHintedArrowId(null);
    setRadarArrowIds(new Set());
    setRadarCharges(3);
    setIsMagnifierActive(false);
    setSparkleBursts([]);
    setComboCount(0);
    setComboBanner(null);
    setLives(targetLevel.startingLives ?? 3);
    setMoves(0);
    setSeconds(0);
    setIsCompleted(false);
    setIsGameOver(false);
    lastLaunchTimeRef.current = 0;
  }, []);

  useEffect(() => {
    initLevel(level);
  }, [level, initLevel]);

  // Timer interval
  useEffect(() => {
    if (isCompleted || isGameOver) return;
    const interval = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isCompleted, isGameOver]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) window.clearTimeout(hintTimeoutRef.current);
      if (radarTimeoutRef.current) window.clearTimeout(radarTimeoutRef.current);
      if (comboTimeoutRef.current) window.clearTimeout(comboTimeoutRef.current);
    };
  }, []);

  // Format seconds mm:ss
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Quick sound mute toggle
  const handleToggleSound = () => {
    const next = !settings.soundEnabled;
    soundEngine.setMuted(!next);
    if (next) soundEngine.playButtonClick();
    if (onUpdateSettings) {
      onUpdateSettings({ ...settings, soundEnabled: next });
    }
  };

  // Handle Arrow Tap
  const handleArrowTap = (arrow: ArrowItem) => {
    if (isCompleted || isGameOver || exitingArrowIds.has(arrow.id)) {
      return;
    }

    // Dismiss hint or radar on tap
    if (hintedArrowId) setHintedArrowId(null);
    if (radarArrowIds.has(arrow.id)) {
      setRadarArrowIds((prev) => {
        const next = new Set(prev);
        next.delete(arrow.id);
        return next;
      });
    }

    const isClear = isArrowPathClear(arrow, activeArrows, level.rows, level.cols);

    if (isClear) {
      // Valid Move: Trigger Snake Slither Launch
      soundEngine.playLaunch();
      triggerHaptic('success', settings.vibrationEnabled);

      // Calculate Combo Streak (if launched within 2.4 seconds)
      const now = Date.now();
      let nextCombo = 1;
      if (lastLaunchTimeRef.current > 0 && now - lastLaunchTimeRef.current < 2400) {
        nextCombo = comboCount + 1;
      }
      setComboCount(nextCombo);
      lastLaunchTimeRef.current = now;

      if (nextCombo >= 2) {
        soundEngine.playCombo(nextCombo);
        const comboLabels = ['Great!', 'Smooth!', 'Swift!', 'Brilliant!', 'Master!', 'Unstoppable!'];
        const label = comboLabels[Math.min(nextCombo - 2, comboLabels.length - 1)];
        setComboBanner({ text: `${label} x${nextCombo}`, count: nextCombo });

        if (comboTimeoutRef.current) window.clearTimeout(comboTimeoutRef.current);
        comboTimeoutRef.current = window.setTimeout(() => {
          setComboBanner(null);
        }, 1600);
      }

      // Save state to undo history
      setHistory((prev) => [...prev, [...activeArrows]]);
      setExitingArrowIds((prev) => new Set(prev).add(arrow.id));
      setMoves((m) => m + 1);

      // Spawn launch sparkle burst at arrow tip
      const pts = arrow.points || [{ row: arrow.row ?? 0, col: arrow.col ?? 0 }];
      const tipPt = pts[pts.length - 1];
      const maxDim = Math.max(level.rows, level.cols);
      const estCell = Math.floor(320 / maxDim);
      const burstId = `burst-${now}-${arrow.id}`;
      setSparkleBursts((prev) => [
        ...prev,
        {
          id: burstId,
          x: tipPt.col * estCell + estCell / 2,
          y: tipPt.row * estCell + estCell / 2,
          color: nextCombo >= 3 ? '#F59E0B' : '#38BDF8',
        },
      ]);
      setTimeout(() => {
        setSparkleBursts((prev) => prev.filter((b) => b.id !== burstId));
      }, 500);

      // Complete removal after snake slither animation finishes (460ms)
      setTimeout(() => {
        setActiveArrows((prev) => {
          const next = prev.filter((a) => a.id !== arrow.id);

          // Check if board is cleared
          if (next.length === 0) {
            const finalStars = settings.casualMode ? 3 : Math.max(1, lives);
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
      }, 460);
    } else {
      // Blocked Move: Error feedback
      soundEngine.playBlocked();
      triggerHaptic('error', settings.vibrationEnabled);
      setBlockedArrowId(arrow.id);
      setComboCount(0);
      setComboBanner(null);

      setTimeout(() => {
        setBlockedArrowId(null);
      }, 320);

      // Deduct life unless in Casual / Relaxed Mode
      if (!settings.casualMode) {
        setLives((currentLives) => {
          const nextLives = currentLives - 1;
          if (nextLives <= 0) {
            setIsGameOver(true);
            soundEngine.playLose();
          }
          return Math.max(0, nextLives);
        });
      }
    }
  };

  // Hint Logic: Highlights first free arrow
  const handleUseHint = () => {
    if (isCompleted || isGameOver) return;

    const freeArrows = getFreeArrows(activeArrows, level.rows, level.cols);
    if (freeArrows.length === 0) return;

    const target = freeArrows[0];
    soundEngine.playHint();
    triggerHaptic('tap', settings.vibrationEnabled);
    setHintedArrowId(target.id);

    if (hintTimeoutRef.current) window.clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = window.setTimeout(() => {
      setHintedArrowId(null);
    }, 3500);
  };

  // Radar (# Tool): Sweeps and pulses ALL free arrows simultaneously
  const handleUseRadar = () => {
    if (isCompleted || isGameOver || radarCharges <= 0 && !settings.casualMode) return;

    const freeArrows = getFreeArrows(activeArrows, level.rows, level.cols);
    if (freeArrows.length === 0) return;

    soundEngine.playRadar();
    triggerHaptic('tap', settings.vibrationEnabled);

    if (!settings.casualMode) {
      setRadarCharges((c) => Math.max(0, c - 1));
    }

    const freeIds = new Set(freeArrows.map((a) => a.id));
    setRadarArrowIds(freeIds);

    if (radarTimeoutRef.current) window.clearTimeout(radarTimeoutRef.current);
    radarTimeoutRef.current = window.setTimeout(() => {
      setRadarArrowIds(new Set());
    }, 2800);
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
    setRadarArrowIds(new Set());
    setComboCount(0);
    setComboBanner(null);
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

  // Progress Percentage
  const progressPercent = initialTotalArrows > 0
    ? Math.round(((initialTotalArrows - activeArrows.length) / initialTotalArrows) * 100)
    : 0;

  return (
    <div
      id="game-screen"
      className="flex flex-col h-full w-full max-w-md mx-auto bg-slate-50 border-x border-slate-200/60 shadow-lg relative overflow-hidden select-none"
    >
      {/* Top Header Bar */}
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
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {level.difficulty}
            </span>
            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-slate-400" />
              {formatTime(seconds)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Sound Mute Toggle */}
          <button
            id="quick-sound-toggle-button"
            onClick={handleToggleSound}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
            title={settings.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-blue-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>

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

      {/* Animated Level Progress Bar */}
      <div className="w-full bg-slate-100 h-1 overflow-hidden shrink-0">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Sub-Header: Lives, Moves & Magnifier Tool */}
      <div className="px-4 py-2.5 flex items-center justify-between bg-white/80 backdrop-blur-xs border-b border-slate-100 shrink-0">
        {/* Lives (3 Hearts or Infinite in Casual Mode) */}
        <div className="flex items-center gap-1.5" id="lives-container">
          {settings.casualMode ? (
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              <span className="text-base font-black leading-none">∞</span>
              <span>Zen</span>
            </div>
          ) : (
            [1, 2, 3].map((heartIndex) => {
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
                    className="w-5 h-5"
                    fill={hasHeart ? 'currentColor' : 'none'}
                    strokeWidth={hasHeart ? 1.5 : 2}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Magnifier / Zoom Inspection Toggle */}
        <button
          id="toggle-magnifier-button"
          onClick={() => {
            soundEngine.playButtonClick();
            setIsMagnifierActive((prev) => !prev);
          }}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
            isMagnifierActive
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Toggle Zoom Inspection Loupe"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Zoom</span>
        </button>

        {/* Moves & Remaining Arrows Tracker */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="bg-slate-100 px-2 py-1 rounded-lg">
            Moves: <strong className="text-slate-800">{moves}</strong>
          </span>
          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg flex items-center gap-1">
            <span>Remaining:</span>
            <strong>{activeArrows.length}</strong>
          </span>
        </div>
      </div>

      {/* Main Game Board Area */}
      <main className="flex-1 flex items-center justify-center p-2 relative overflow-hidden">
        {/* Floating Combo Banner */}
        {comboBanner && (
          <div className="absolute top-3 z-40 animate-bounce pointer-events-none">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 tracking-wide ring-2 ring-white/50">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{comboBanner.text}</span>
            </div>
          </div>
        )}

        <GameBoard
          level={level}
          activeArrows={activeArrows}
          exitingArrowIds={exitingArrowIds}
          blockedArrowId={blockedArrowId}
          hintedArrowId={hintedArrowId}
          radarArrowIds={radarArrowIds}
          isMagnifierActive={isMagnifierActive}
          sparkleBursts={sparkleBursts}
          onArrowTap={handleArrowTap}
          disabled={isCompleted || isGameOver}
          theme={settings.boardTheme}
        />
      </main>

      {/* Bottom Action Controls */}
      <footer className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0 gap-2">
        {/* Undo Button */}
        <button
          id="undo-move-button"
          onClick={handleUndo}
          disabled={history.length === 0 || isCompleted || isGameOver}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none active:scale-95 text-slate-700 transition-all flex flex-col items-center gap-0.5 min-w-[56px]"
          title="Undo Move"
        >
          <Undo2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Undo</span>
        </button>

        {/* Radar (# Scan Tool from Reference Image) */}
        <button
          id="use-radar-button"
          onClick={handleUseRadar}
          disabled={isCompleted || isGameOver || activeArrows.length === 0 || (!settings.casualMode && radarCharges <= 0)}
          className={`p-2.5 rounded-2xl disabled:opacity-40 disabled:pointer-events-none active:scale-95 transition-all flex flex-col items-center gap-0.5 min-w-[56px] relative ${
            radarArrowIds.size > 0
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Scan & Pulse All Free Arrows"
        >
          <Hash className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Radar</span>
          {!settings.casualMode && (
            <span className="absolute -top-1 -right-1 bg-sky-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs">
              {radarCharges}
            </span>
          )}
        </button>

        {/* Center Primary Hint Button */}
        <button
          id="use-hint-button"
          onClick={handleUseHint}
          disabled={isCompleted || isGameOver || activeArrows.length === 0}
          className="flex-1 max-w-[140px] py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
        >
          <Lightbulb className="w-5 h-5 text-amber-300" />
          <span>Hint</span>
        </button>

        {/* Restart Button */}
        <button
          id="restart-level-button"
          onClick={handleRestart}
          disabled={isCompleted}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-all flex flex-col items-center gap-0.5 min-w-[56px]"
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
