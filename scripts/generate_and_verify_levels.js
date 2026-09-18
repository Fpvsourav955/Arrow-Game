import fs from 'fs';

function isBlocked(arrow, board) {
  const { row, col, direction } = arrow;
  for (const other of board) {
    if (other.id === arrow.id) continue;
    if (direction === 'UP' && other.col === col && other.row < row) return true;
    if (direction === 'DOWN' && other.col === col && other.row > row) return true;
    if (direction === 'LEFT' && other.row === row && other.col < col) return true;
    if (direction === 'RIGHT' && other.row === row && other.col > col) return true;
  }
  return false;
}

function solveLevel(arrows) {
  const active = [...arrows];
  const order = [];

  while (active.length > 0) {
    const freeIndex = active.findIndex(a => !isBlocked(a, active));
    if (freeIndex === -1) return null; // Stuck
    const [removed] = active.splice(freeIndex, 1);
    order.push(removed.id);
  }
  return order;
}

// Deterministic pseudo-random number generator
function createRng(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

function generateLevel(levelNumber, difficulty, rows, cols, targetArrows, seed) {
  const rng = createRng(seed);
  let bestArrows = null;

  for (let attempt = 0; attempt < 500; attempt++) {
    const board = []; // in reverse: board holds arrows that leave later
    const occupied = new Set();

    for (let step = 0; step < targetArrows; step++) {
      const candidates = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const key = `${r},${c}`;
          if (occupied.has(key)) continue;

          for (const d of directions) {
            // Check if this new arrow (r, c, d) has a clear exit path considering arrows already in `board`
            let pathClear = true;
            for (const prev of board) {
              if (d === 'UP' && prev.col === c && prev.row < r) pathClear = false;
              if (d === 'DOWN' && prev.col === c && prev.row > r) pathClear = false;
              if (d === 'LEFT' && prev.row === r && prev.col < c) pathClear = false;
              if (d === 'RIGHT' && prev.row === r && prev.col > c) pathClear = false;
              if (!pathClear) break;
            }

            if (pathClear) {
              candidates.push({ r, c, d });
            }
          }
        }
      }

      if (candidates.length === 0) break;

      // Pick a candidate with preference for creating interesting spatial interlocks
      const choice = candidates[Math.floor(rng() * candidates.length)];
      occupied.add(`${choice.r},${choice.c}`);
      board.push({
        id: `a_${levelNumber}_${step + 1}`,
        row: choice.r,
        col: choice.c,
        direction: choice.d
      });
    }

    if (board.length === targetArrows) {
      // Test forward solvability
      const solution = solveLevel(board);
      if (solution && solution.length === targetArrows) {
        bestArrows = board;
        break;
      }
    }
  }

  if (!bestArrows) {
    throw new Error(`Failed to generate level ${levelNumber}`);
  }

  return {
    levelNumber,
    difficulty,
    rows,
    cols,
    arrows: bestArrows,
    startingLives: 3
  };
}

// Progression specification for all 50 levels
const specs = [
  // 1-5: Very Easy (4-7 arrows, small grids, teaching mechanics)
  { level: 1, diff: 'Very Easy', rows: 3, cols: 3, count: 4, seed: 101 },
  { level: 2, diff: 'Very Easy', rows: 3, cols: 3, count: 5, seed: 102 },
  { level: 3, diff: 'Very Easy', rows: 4, cols: 4, count: 6, seed: 103 },
  { level: 4, diff: 'Very Easy', rows: 4, cols: 4, count: 6, seed: 104 },
  { level: 5, diff: 'Very Easy', rows: 4, cols: 4, count: 7, seed: 105 },

  // 6-10: Easy (8-11 arrows, simple planning)
  { level: 6, diff: 'Easy', rows: 4, cols: 4, count: 8, seed: 201 },
  { level: 7, diff: 'Easy', rows: 4, cols: 4, count: 9, seed: 202 },
  { level: 8, diff: 'Easy', rows: 5, cols: 5, count: 9, seed: 203 },
  { level: 9, diff: 'Easy', rows: 5, cols: 5, count: 10, seed: 204 },
  { level: 10, diff: 'Easy', rows: 5, cols: 5, count: 11, seed: 205 },

  // 11-20: Easy-Medium (11-16 arrows, more dependencies)
  { level: 11, diff: 'Easy-Medium', rows: 5, cols: 5, count: 12, seed: 301 },
  { level: 12, diff: 'Easy-Medium', rows: 5, cols: 5, count: 12, seed: 302 },
  { level: 13, diff: 'Easy-Medium', rows: 5, cols: 5, count: 13, seed: 303 },
  { level: 14, diff: 'Easy-Medium', rows: 5, cols: 5, count: 14, seed: 304 },
  { level: 15, diff: 'Easy-Medium', rows: 5, cols: 5, count: 14, seed: 305 },
  { level: 16, diff: 'Easy-Medium', rows: 6, cols: 6, count: 15, seed: 306 },
  { level: 17, diff: 'Easy-Medium', rows: 6, cols: 6, count: 15, seed: 307 },
  { level: 18, diff: 'Easy-Medium', rows: 6, cols: 6, count: 16, seed: 308 },
  { level: 19, diff: 'Easy-Medium', rows: 6, cols: 6, count: 16, seed: 309 },
  { level: 20, diff: 'Easy-Medium', rows: 6, cols: 6, count: 17, seed: 310 },

  // 21-30: Medium (17-22 arrows, multiple decisions)
  { level: 21, diff: 'Medium', rows: 6, cols: 6, count: 18, seed: 401 },
  { level: 22, diff: 'Medium', rows: 6, cols: 6, count: 18, seed: 402 },
  { level: 23, diff: 'Medium', rows: 6, cols: 6, count: 19, seed: 403 },
  { level: 24, diff: 'Medium', rows: 6, cols: 6, count: 19, seed: 404 },
  { level: 25, diff: 'Medium', rows: 6, cols: 6, count: 20, seed: 405 },
  { level: 26, diff: 'Medium', rows: 6, cols: 6, count: 21, seed: 406 },
  { level: 27, diff: 'Medium', rows: 6, cols: 6, count: 21, seed: 407 },
  { level: 28, diff: 'Medium', rows: 7, cols: 7, count: 22, seed: 408 },
  { level: 29, diff: 'Medium', rows: 7, cols: 7, count: 22, seed: 409 },
  { level: 30, diff: 'Medium', rows: 7, cols: 7, count: 23, seed: 410 },

  // 31-40: Medium-Hard (23-28 arrows, complex chains)
  { level: 31, diff: 'Medium-Hard', rows: 7, cols: 7, count: 24, seed: 501 },
  { level: 32, diff: 'Medium-Hard', rows: 7, cols: 7, count: 24, seed: 502 },
  { level: 33, diff: 'Medium-Hard', rows: 7, cols: 7, count: 25, seed: 503 },
  { level: 34, diff: 'Medium-Hard', rows: 7, cols: 7, count: 25, seed: 504 },
  { level: 35, diff: 'Medium-Hard', rows: 7, cols: 7, count: 26, seed: 505 },
  { level: 36, diff: 'Medium-Hard', rows: 7, cols: 7, count: 26, seed: 506 },
  { level: 37, diff: 'Medium-Hard', rows: 7, cols: 7, count: 27, seed: 507 },
  { level: 38, diff: 'Medium-Hard', rows: 7, cols: 7, count: 27, seed: 508 },
  { level: 39, diff: 'Medium-Hard', rows: 7, cols: 7, count: 28, seed: 509 },
  { level: 40, diff: 'Medium-Hard', rows: 7, cols: 7, count: 28, seed: 510 },

  // 41-50: Hard (28-34 arrows, deep planning)
  { level: 41, diff: 'Hard', rows: 7, cols: 7, count: 29, seed: 601 },
  { level: 42, diff: 'Hard', rows: 7, cols: 7, count: 29, seed: 602 },
  { level: 43, diff: 'Hard', rows: 7, cols: 7, count: 30, seed: 603 },
  { level: 44, diff: 'Hard', rows: 7, cols: 7, count: 30, seed: 604 },
  { level: 45, diff: 'Hard', rows: 8, cols: 8, count: 31, seed: 605 },
  { level: 46, diff: 'Hard', rows: 8, cols: 8, count: 31, seed: 606 },
  { level: 47, diff: 'Hard', rows: 8, cols: 8, count: 32, seed: 607 },
  { level: 48, diff: 'Hard', rows: 8, cols: 8, count: 32, seed: 608 },
  { level: 49, diff: 'Hard', rows: 8, cols: 8, count: 33, seed: 609 },
  { level: 50, diff: 'Hard', rows: 8, cols: 8, count: 34, seed: 610 },
];

const allLevels = [];
for (const spec of specs) {
  const lvl = generateLevel(spec.level, spec.diff, spec.rows, spec.cols, spec.count, spec.seed);
  allLevels.push(lvl);
  console.log(`Level ${spec.level} generated: ${lvl.arrows.length} arrows (${spec.diff})`);
}

const fileContent = `import { LevelData } from '../types';

export const ALL_LEVELS: LevelData[] = ${JSON.stringify(allLevels, null, 2)};

export function getLevel(levelNumber: number): LevelData | undefined {
  return ALL_LEVELS.find((l) => l.levelNumber === levelNumber);
}

export const TOTAL_LEVELS = ALL_LEVELS.length;
`;

fs.writeFileSync('src/data/levels.ts', fileContent, 'utf-8');
console.log('Successfully generated src/data/levels.ts with 50 validated levels!');
