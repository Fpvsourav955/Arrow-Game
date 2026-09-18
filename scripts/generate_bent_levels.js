import fs from 'fs';

function inBounds(r, c, rows, cols) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

function getArrowCells(arrow) {
  const cells = [];
  const pts = arrow.points;
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const dr = Math.sign(p2.row - p1.row);
    const dc = Math.sign(p2.col - p1.col);
    let r = p1.row;
    let c = p1.col;
    cells.push({ row: r, col: c });
    while (r !== p2.row || c !== p2.col) {
      r += dr;
      c += dc;
      cells.push({ row: r, col: c });
    }
  }
  return cells;
}

function isArrowFree(arrow, allActiveArrows, rows, cols) {
  const head = arrow.points[arrow.points.length - 1];
  let dr = 0, dc = 0;
  if (arrow.direction === 'UP') dr = -1;
  if (arrow.direction === 'DOWN') dr = 1;
  if (arrow.direction === 'LEFT') dc = -1;
  if (arrow.direction === 'RIGHT') dc = 1;

  const occupied = new Set();
  for (const other of allActiveArrows) {
    if (other.id === arrow.id) continue;
    for (const cell of getArrowCells(other)) {
      occupied.add(`${cell.row},${cell.col}`);
    }
  }

  let r = head.row + dr;
  let c = head.col + dc;
  while (inBounds(r, c, rows, cols)) {
    if (occupied.has(`${r},${c}`)) {
      return false;
    }
    r += dr;
    c += dc;
  }
  return true;
}

function solveLevel(arrows, rows, cols) {
  const active = [...arrows];
  const order = [];

  while (active.length > 0) {
    const freeIndex = active.findIndex(a => isArrowFree(a, active, rows, cols));
    if (freeIndex === -1) return null;
    const [removed] = active.splice(freeIndex, 1);
    order.push(removed.id);
  }
  return order;
}

function createRng(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const DIRS = [
  { name: 'UP', dr: -1, dc: 0 },
  { name: 'DOWN', dr: 1, dc: 0 },
  { name: 'LEFT', dr: 0, dc: -1 },
  { name: 'RIGHT', dr: 0, dc: 1 },
];

function generateBentArrowLevel(levelNumber, difficulty, rows, cols, targetArrows, maxBends, seed, allowedRegion = null) {
  const rng = createRng(seed);

  for (let attempt = 0; attempt < 1200; attempt++) {
    const arrows = [];
    const occupied = new Set();

    for (let step = 0; step < targetArrows; step++) {
      const candidates = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (allowedRegion && !allowedRegion(r, c)) continue;
          if (occupied.has(`${r},${c}`)) continue;

          for (const d of DIRS) {
            let rayClear = true;
            let checkR = r + d.dr;
            let checkC = c + d.dc;
            while (inBounds(checkR, checkC, rows, cols)) {
              if (occupied.has(`${checkR},${checkC}`)) {
                rayClear = false;
                break;
              }
              checkR += d.dr;
              checkC += d.dc;
            }

            if (rayClear) {
              candidates.push({ r, c, d });
            }
          }
        }
      }

      if (candidates.length === 0) break;

      const headCandidate = candidates[Math.floor(rng() * candidates.length)];
      const head = { row: headCandidate.r, col: headCandidate.c };
      const forwardDir = headCandidate.d;
      const reverseDir = { dr: -forwardDir.dr, dc: -forwardDir.dc };

      // Number of bends for this arrow
      let bendsForThis = Math.floor(rng() * (maxBends + 1));
      if (step === 0) bendsForThis = Math.min(bendsForThis, 1);

      const path = [head];
      let curR = head.row;
      let curC = head.col;
      let curDr = reverseDir.dr;
      let curDc = reverseDir.dc;
      let validArrow = true;

      const segmentsCount = bendsForThis + 1;
      const occupiedInArrow = new Set([`${curR},${curC}`]);

      for (let seg = 0; seg < segmentsCount; seg++) {
        const segLen = (rng() > 0.5 ? 2 : 1);

        for (let stepLen = 0; stepLen < segLen; stepLen++) {
          const nextR = curR + curDr;
          const nextC = curC + curDc;

          if (
            !inBounds(nextR, nextC, rows, cols) ||
            (allowedRegion && !allowedRegion(nextR, nextC)) ||
            occupied.has(`${nextR},${nextC}`) ||
            occupiedInArrow.has(`${nextR},${nextC}`)
          ) {
            break;
          }

          curR = nextR;
          curC = nextC;
          occupiedInArrow.add(`${curR},${curC}`);
          path.push({ row: curR, col: curC });
        }

        if (seg < segmentsCount - 1) {
          const turnOptions = [
            { dr: -curDc, dc: curDr },
            { dr: curDc, dc: -curDr }
          ].filter(turn => {
            const tr = curR + turn.dr;
            const tc = curC + turn.dc;
            return (
              inBounds(tr, tc, rows, cols) &&
              (!allowedRegion || allowedRegion(tr, tc)) &&
              !occupied.has(`${tr},${tc}`) &&
              !occupiedInArrow.has(`${tr},${tc}`)
            );
          });

          if (turnOptions.length === 0) break;

          const chosenTurn = turnOptions[Math.floor(rng() * turnOptions.length)];
          curDr = chosenTurn.dr;
          curDc = chosenTurn.dc;
        }
      }

      if (path.length < 2) {
        const nextR = head.row + reverseDir.dr;
        const nextC = head.col + reverseDir.dc;
        if (
          inBounds(nextR, nextC, rows, cols) &&
          (!allowedRegion || allowedRegion(nextR, nextC)) &&
          !occupied.has(`${nextR},${nextC}`)
        ) {
          path.push({ row: nextR, col: nextC });
          occupiedInArrow.add(`${nextR},${nextC}`);
        } else {
          validArrow = false;
        }
      }

      if (!validArrow || path.length < 2) continue;

      path.reverse();

      const vertices = [path[0]];
      for (let i = 1; i < path.length - 1; i++) {
        const prev = path[i - 1];
        const cur = path[i];
        const next = path[i + 1];
        const d1r = cur.row - prev.row;
        const d1c = cur.col - prev.col;
        const d2r = next.row - cur.row;
        const d2c = next.col - cur.col;
        if (d1r !== d2r || d1c !== d2c) {
          vertices.push(cur);
        }
      }
      vertices.push(path[path.length - 1]);

      const newArrow = {
        id: `arrow_${levelNumber}_${step + 1}`,
        points: vertices,
        direction: forwardDir.name,
      };

      for (const key of occupiedInArrow) {
        occupied.add(key);
      }

      arrows.push(newArrow);
    }

    if (arrows.length >= Math.max(3, targetArrows - 4)) {
      const sol = solveLevel(arrows, rows, cols);
      if (sol && sol.length === arrows.length) {
        return {
          levelNumber,
          difficulty,
          rows,
          cols,
          arrows,
          startingLives: 3,
        };
      }
    }
  }

  // Fallback: if not enough arrows after 1200 attempts, retry with slightly smaller target
  if (targetArrows > 5) {
    return generateBentArrowLevel(levelNumber, difficulty, rows, cols, targetArrows - 2, maxBends, seed + 999, allowedRegion);
  }

  throw new Error(`Failed to generate level ${levelNumber}`);
}

// Special Level 42: Heart-shaped layout inspired by the screenshot's Level 42
function isHeartCell(r, c) {
  // 8x8 heart mask
  const heart = [
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ];
  return heart[r] && heart[r][c] === 1;
}

// 50 Levels Specifications
const specs = [
  // 1-5: Very Easy (intro to straight & L-shaped arrows)
  { level: 1, diff: 'Very Easy', rows: 4, cols: 4, count: 4, maxBends: 1, seed: 1011 },
  { level: 2, diff: 'Very Easy', rows: 4, cols: 4, count: 5, maxBends: 1, seed: 1022 },
  { level: 3, diff: 'Very Easy', rows: 4, cols: 4, count: 5, maxBends: 1, seed: 1033 },
  { level: 4, diff: 'Very Easy', rows: 5, cols: 5, count: 6, maxBends: 1, seed: 1044 },
  { level: 5, diff: 'Very Easy', rows: 5, cols: 5, count: 6, maxBends: 2, seed: 1055 },

  // 6-10: Easy (introducing U-shaped & mixed bends)
  { level: 6, diff: 'Easy', rows: 5, cols: 5, count: 7, maxBends: 2, seed: 2011 },
  { level: 7, diff: 'Easy', rows: 5, cols: 5, count: 8, maxBends: 2, seed: 2022 },
  { level: 8, diff: 'Easy', rows: 5, cols: 5, count: 8, maxBends: 2, seed: 2033 },
  { level: 9, diff: 'Easy', rows: 6, cols: 6, count: 9, maxBends: 2, seed: 2044 },
  { level: 10, diff: 'Easy', rows: 6, cols: 6, count: 10, maxBends: 2, seed: 2055 },

  // 11-20: Easy-Medium (interlocking L and U bends)
  { level: 11, diff: 'Easy-Medium', rows: 6, cols: 6, count: 10, maxBends: 2, seed: 3011 },
  { level: 12, diff: 'Easy-Medium', rows: 6, cols: 6, count: 11, maxBends: 2, seed: 3022 },
  { level: 13, diff: 'Easy-Medium', rows: 6, cols: 6, count: 11, maxBends: 2, seed: 3033 },
  { level: 14, diff: 'Easy-Medium', rows: 6, cols: 6, count: 12, maxBends: 2, seed: 3044 },
  { level: 15, diff: 'Easy-Medium', rows: 6, cols: 6, count: 12, maxBends: 3, seed: 3055 },
  { level: 16, diff: 'Easy-Medium', rows: 6, cols: 6, count: 13, maxBends: 3, seed: 3066 },
  { level: 17, diff: 'Easy-Medium', rows: 6, cols: 6, count: 13, maxBends: 3, seed: 3077 },
  { level: 18, diff: 'Easy-Medium', rows: 6, cols: 6, count: 14, maxBends: 3, seed: 3088 },
  { level: 19, diff: 'Easy-Medium', rows: 6, cols: 6, count: 14, maxBends: 3, seed: 3099 },
  { level: 20, diff: 'Easy-Medium', rows: 6, cols: 6, count: 15, maxBends: 3, seed: 3100 },

  // 21-30: Medium (7x7 boards, serpentine arrows)
  { level: 21, diff: 'Medium', rows: 7, cols: 7, count: 15, maxBends: 3, seed: 4011 },
  { level: 22, diff: 'Medium', rows: 7, cols: 7, count: 16, maxBends: 3, seed: 4022 },
  { level: 23, diff: 'Medium', rows: 7, cols: 7, count: 16, maxBends: 3, seed: 4033 },
  { level: 24, diff: 'Medium', rows: 7, cols: 7, count: 17, maxBends: 3, seed: 4044 },
  { level: 25, diff: 'Medium', rows: 7, cols: 7, count: 17, maxBends: 3, seed: 4055 },
  { level: 26, diff: 'Medium', rows: 7, cols: 7, count: 18, maxBends: 3, seed: 4066 },
  { level: 27, diff: 'Medium', rows: 7, cols: 7, count: 18, maxBends: 3, seed: 4077 },
  { level: 28, diff: 'Medium', rows: 7, cols: 7, count: 19, maxBends: 3, seed: 4088 },
  { level: 29, diff: 'Medium', rows: 7, cols: 7, count: 19, maxBends: 3, seed: 4099 },
  { level: 30, diff: 'Medium', rows: 7, cols: 7, count: 20, maxBends: 3, seed: 4100 },

  // 31-40: Medium-Hard (deep chains & loops)
  { level: 31, diff: 'Medium-Hard', rows: 7, cols: 7, count: 20, maxBends: 3, seed: 5011 },
  { level: 32, diff: 'Medium-Hard', rows: 7, cols: 7, count: 21, maxBends: 3, seed: 5022 },
  { level: 33, diff: 'Medium-Hard', rows: 7, cols: 7, count: 21, maxBends: 3, seed: 5033 },
  { level: 34, diff: 'Medium-Hard', rows: 7, cols: 7, count: 22, maxBends: 3, seed: 5044 },
  { level: 35, diff: 'Medium-Hard', rows: 7, cols: 7, count: 22, maxBends: 3, seed: 5055 },
  { level: 36, diff: 'Medium-Hard', rows: 8, cols: 8, count: 23, maxBends: 4, seed: 5066 },
  { level: 37, diff: 'Medium-Hard', rows: 8, cols: 8, count: 23, maxBends: 4, seed: 5077 },
  { level: 38, diff: 'Medium-Hard', rows: 8, cols: 8, count: 24, maxBends: 4, seed: 5088 },
  { level: 39, diff: 'Medium-Hard', rows: 8, cols: 8, count: 24, maxBends: 4, seed: 5099 },
  { level: 40, diff: 'Medium-Hard', rows: 8, cols: 8, count: 25, maxBends: 4, seed: 5100 },

  // 41-50: Hard (intricate mazes, Level 42 heart layout!)
  { level: 41, diff: 'Hard', rows: 8, cols: 8, count: 25, maxBends: 4, seed: 6011 },
  { level: 42, diff: 'Hard', rows: 8, cols: 8, count: 18, maxBends: 3, seed: 6022, region: isHeartCell }, // Iconic Heart Maze!
  { level: 43, diff: 'Hard', rows: 8, cols: 8, count: 26, maxBends: 4, seed: 6033 },
  { level: 44, diff: 'Hard', rows: 8, cols: 8, count: 26, maxBends: 4, seed: 6044 },
  { level: 45, diff: 'Hard', rows: 8, cols: 8, count: 27, maxBends: 4, seed: 6055 },
  { level: 46, diff: 'Hard', rows: 8, cols: 8, count: 27, maxBends: 4, seed: 6066 },
  { level: 47, diff: 'Hard', rows: 8, cols: 8, count: 28, maxBends: 4, seed: 6077 },
  { level: 48, diff: 'Hard', rows: 8, cols: 8, count: 28, maxBends: 4, seed: 6088 },
  { level: 49, diff: 'Hard', rows: 8, cols: 8, count: 29, maxBends: 4, seed: 6099 },
  { level: 50, diff: 'Hard', rows: 8, cols: 8, count: 30, maxBends: 4, seed: 6100 },
];

console.log('Generating all 50 bent-arrow levels...');
const allLevels = [];
for (const spec of specs) {
  const lvl = generateBentArrowLevel(
    spec.level,
    spec.diff,
    spec.rows,
    spec.cols,
    spec.count,
    spec.maxBends,
    spec.seed,
    spec.region || null
  );
  allLevels.push(lvl);
  console.log(`✓ Level ${lvl.levelNumber}: ${lvl.arrows.length} bent arrows (${lvl.difficulty}, ${lvl.rows}x${lvl.cols})`);
}

const fileContent = `import { LevelData } from '../types';

export const ALL_LEVELS: LevelData[] = ${JSON.stringify(allLevels, null, 2)};

export function getLevel(levelNumber: number): LevelData | undefined {
  return ALL_LEVELS.find((l) => l.levelNumber === levelNumber);
}

export const TOTAL_LEVELS = ALL_LEVELS.length;
`;

fs.writeFileSync('src/data/levels.ts', fileContent, 'utf-8');
console.log('Done! Successfully wrote 50 verified bent-arrow levels to src/data/levels.ts');
