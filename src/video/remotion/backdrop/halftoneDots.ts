import type { Frame } from "../theme";

export type Dot = { id: string; x: number; y: number; r: number };

const cellShare = 0.042;
const rowStep = Math.sqrt(3) / 2;
const maxRadiusShare = 0.48;
const reachShare = 0.31;
const falloffPower = 1.4;
const smallestPx = 0.6;
const driftCellsPerSecond = 0.35;

// A halftone screen whose dots grow toward the top-right and bottom-left corners and vanish well before the
// middle, sliding slowly along the screen while the corners stay put.
export function halftoneDots(frame: Frame, ms: number): Dot[] {
  const cell = frame.width * cellShare;
  const drift = ((driftCellsPerSecond * ms) / 1000) % 1;
  const reach = Math.hypot(frame.width, frame.height) * reachShare;
  const columns = Math.ceil(frame.width / cell) + 2;
  const rows = Math.ceil(frame.height / (cell * rowStep)) + 2;
  const dots: Dot[] = [];

  for (let row = -1; row < rows; row++) {
    for (let column = -1; column < columns; column++) {
      const x = (column + drift + (row % 2) / 2) * cell;
      const y = row * cell * rowStep;
      const r = cell * maxRadiusShare * cornerWeight(frame, x, y, reach);
      if (r >= smallestPx) dots.push({ id: `${row}:${column}`, x, y, r });
    }
  }

  return dots;
}

function cornerWeight(frame: Frame, x: number, y: number, reach: number): number {
  const fromTopRight = Math.hypot(frame.width - x, y);
  const fromBottomLeft = Math.hypot(x, frame.height - y);
  const nearest = Math.min(fromTopRight, fromBottomLeft);

  return Math.max(0, 1 - nearest / reach) ** falloffPower;
}
