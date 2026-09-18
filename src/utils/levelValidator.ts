import { ArrowItem, LevelData, Point } from '../types';

/**
 * Returns all grid cells occupied by an arrow (along all line segments).
 */
export function getArrowOccupiedCells(arrow: ArrowItem): Point[] {
  if (!arrow.points || arrow.points.length === 0) {
    if (typeof arrow.row === 'number' && typeof arrow.col === 'number') {
      return [{ row: arrow.row, col: arrow.col }];
    }
    return [];
  }
  if (arrow.points.length === 1) {
    return [arrow.points[0]];
  }

  const cells: Point[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < arrow.points.length - 1; i++) {
    const p1 = arrow.points[i];
    const p2 = arrow.points[i + 1];
    const dr = Math.sign(p2.row - p1.row);
    const dc = Math.sign(p2.col - p1.col);
    let r = p1.row;
    let c = p1.col;

    const key = `${r},${c}`;
    if (!seen.has(key)) {
      seen.add(key);
      cells.push({ row: r, col: c });
    }

    while (r !== p2.row || c !== p2.col) {
      r += dr;
      c += dc;
      const stepKey = `${r},${c}`;
      if (!seen.has(stepKey)) {
        seen.add(stepKey);
        cells.push({ row: r, col: c });
      }
    }
  }

  return cells;
}

/**
 * Checks if an arrow's exit path forward from its head is completely clear of other active arrows.
 */
export function isArrowPathClear(
  arrow: ArrowItem,
  activeArrows: ArrowItem[],
  boardRows = 20,
  boardCols = 20
): boolean {
  const head = arrow.points && arrow.points.length > 0
    ? arrow.points[arrow.points.length - 1]
    : { row: arrow.row ?? 0, col: arrow.col ?? 0 };

  let dr = 0;
  let dc = 0;
  switch (arrow.direction) {
    case 'UP': dr = -1; break;
    case 'DOWN': dr = 1; break;
    case 'LEFT': dc = -1; break;
    case 'RIGHT': dc = 1; break;
  }

  // Pre-collect occupied cells of all other active arrows
  const occupied = new Set<string>();
  for (const other of activeArrows) {
    if (other.id === arrow.id) continue;
    const cells = getArrowOccupiedCells(other);
    for (const cell of cells) {
      occupied.add(`${cell.row},${cell.col}`);
    }
  }

  let r = head.row + dr;
  let c = head.col + dc;

  while (r >= 0 && r < boardRows && c >= 0 && c < boardCols) {
    if (occupied.has(`${r},${c}`)) {
      return false; // Path is blocked by another arrow
    }
    r += dr;
    c += dc;
  }

  return true;
}

/**
 * Returns all arrows that currently have an unobstructed exit path.
 */
export function getFreeArrows(
  activeArrows: ArrowItem[],
  boardRows = 20,
  boardCols = 20
): ArrowItem[] {
  return activeArrows.filter((arrow) => isArrowPathClear(arrow, activeArrows, boardRows, boardCols));
}

/**
 * Validates whether a level has at least one complete sequence that clears the board.
 * Uses a backtrack / greedy search to find a valid solution.
 */
export function validateLevelSolvable(level: LevelData): { solvable: boolean; solutionOrder: string[] } {
  const initialArrows = [...level.arrows];
  const solutionOrder: string[] = [];

  function solve(remaining: ArrowItem[]): boolean {
    if (remaining.length === 0) {
      return true;
    }

    const free = getFreeArrows(remaining);
    if (free.length === 0) {
      return false;
    }

    // Try each free arrow
    for (const arrow of free) {
      solutionOrder.push(arrow.id);
      const nextRemaining = remaining.filter((a) => a.id !== arrow.id);
      if (solve(nextRemaining)) {
        return true;
      }
      solutionOrder.pop();
    }

    return false;
  }

  const solvable = solve(initialArrows);
  return { solvable, solutionOrder };
}
