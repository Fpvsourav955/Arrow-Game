import { GameProgress, GameSettings, LevelResult } from '../types';

const PROGRESS_KEY = 'arrow_escape_progress_v1';
const SETTINGS_KEY = 'arrow_escape_settings_v1';

const DEFAULT_PROGRESS: GameProgress = {
  completedLevels: {},
  highestUnlocked: 1,
  currentLevel: 1,
  totalHints: 3,
};

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  boardTheme: 'clean',
};

export function loadGameProgress(): GameProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    return {
      completedLevels: parsed.completedLevels || {},
      highestUnlocked: parsed.highestUnlocked || 1,
      currentLevel: parsed.currentLevel || 1,
      totalHints: typeof parsed.totalHints === 'number' ? parsed.totalHints : 3,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveGameProgress(progress: GameProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors
  }
}

export function recordLevelCompletion(levelNumber: number, stars: number, moves: number): GameProgress {
  const current = loadGameProgress();
  const existing = current.completedLevels[levelNumber];
  
  const bestStars = existing ? Math.max(existing.stars, stars) : stars;
  const bestMoves = existing ? Math.min(existing.moves, moves) : moves;

  const updatedResult: LevelResult = {
    stars: bestStars,
    moves: bestMoves,
    completedAt: Date.now(),
  };

  const nextUnlocked = Math.max(current.highestUnlocked, Math.min(levelNumber + 1, 50));
  const updatedProgress: GameProgress = {
    ...current,
    completedLevels: {
      ...current.completedLevels,
      [levelNumber]: updatedResult,
    },
    highestUnlocked: nextUnlocked,
    currentLevel: Math.min(levelNumber + 1, 50),
    // Reward a hint every 3 levels if below 5
    totalHints: levelNumber % 3 === 0 ? Math.min(current.totalHints + 1, 5) : current.totalHints,
  };

  saveGameProgress(updatedProgress);
  return updatedProgress;
}

export function resetGameProgress(): GameProgress {
  const reset = { ...DEFAULT_PROGRESS };
  saveGameProgress(reset);
  return reset;
}

export function loadGameSettings(): GameSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveGameSettings(settings: GameSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}
