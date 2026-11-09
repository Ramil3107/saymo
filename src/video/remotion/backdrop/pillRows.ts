import type { Frame } from "../theme";

export type Pill = { slot: number; x: number; w: number; tint: number };
export type PillRow = { row: number; y: number; h: number; pills: Pill[] };

export const pillTints = 3;

const heightShare = 0.065;
const gapShare = 0.5;
const lengths = [2.6, 4.2, 3.1, 1.9, 3.7];
const speedShare = 0.03;
const staggerShare = 0.37;

// The square the rows are laid in before it is turned: wide enough to cover the frame at any angle.
export function pillSquare(frame: Frame): number {
  return Math.ceil(Math.hypot(frame.width, frame.height));
}

// Rows of pills across the square, each sliding the other way from its neighbours.
export function pillRows(frame: Frame, ms: number): PillRow[] {
  const side = pillSquare(frame);
  const h = frame.width * heightShare;
  const gap = h * gapShare;
  const count = Math.ceil(side / (h + gap)) + 1;

  return Array.from({ length: count }, (_, row) => ({
    row,
    y: row * (h + gap) - gap,
    h,
    pills: rowPills(row, { side, h, gap, travel: (frame.width * speedShare * ms) / 1000 }),
  }));
}

type RowSpec = { side: number; h: number; gap: number; travel: number };

function rowPills(row: number, { side, h, gap, travel }: RowSpec): Pill[] {
  const period = lengths.reduce((sum, length) => sum + length * h + gap, 0);
  const direction = row % 2 === 0 ? 1 : -1;
  const pills: Pill[] = [];
  let x = positiveModulo(row * period * staggerShare + direction * travel, period) - period;

  for (let index = 0; x < side + gap; index++) {
    const w = (lengths[index % lengths.length] ?? 1) * h;
    pills.push({ slot: index, x, w, tint: (row + index) % pillTints });
    x += w + gap;
  }

  return pills;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
