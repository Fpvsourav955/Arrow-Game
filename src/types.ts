export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type Difficulty = 
  | 'Very Easy'
  | 'Easy'
  | 'Easy-Medium'
  | 'Medium'
  | 'Medium-Hard'
  | 'Hard';

export interface Point {
  row: number;
  col: number;
}

export interface ArrowItem {
  id: string;
  points: Point[];
  direction: Direction;
  row?: number;
  col?: number;
}

export interface LevelData {
  levelNumber: number;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  arrows: ArrowItem[];
  startingLives?: number;
}

export interface LevelResult {
  stars: number; // 1, 2, or 3 stars
  moves: number;
  completedAt: number;
}

export interface GameProgress {
  completedLevels: Record<number, LevelResult>;
  highestUnlocked: number;
  currentLevel: number;
  totalHints: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  boardTheme: 'clean' | 'warm';
  casualMode?: boolean;
}

export type ScreenState = 'HOME' | 'LEVEL_SELECT' | 'GAME';
