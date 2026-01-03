import type { BloomStep } from "./PrimordialSoupTypes";

export const cross1: Array<[number, number]> = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1]
];

export const square3: Array<[number, number]> = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

export const cross2: Array<[number, number]> = [
  [-2, 0],
  [0, 2],
  [2, 0],
  [0, -2]
];

export const thickCross2: Array<[number, number]> = [
  [-2, -1], [-2, 1],
  [-1, -2], [-1, 2],
  [1, -2],  [1, 2],
  [2, -1],  [2, 1]
];

export const square5Remainder: Array<[number, number]> = [
  [-2, -2], [-2, -1], [-2, 0], [-2, 1], [-2, 2],
  [-1, -2], [-1, -1], [-1, 0], [-1, 1], [-1, 2],
  [0, -2],  [0, -1],           [0, 1],  [0, 2],
  [1, -2],  [1, -1],  [1, 0],  [1, 1],  [1, 2],
  [2, -2],  [2, -1],  [2, 0],  [2, 1],  [2, 2]
];

export const stepBloom5x5: BloomStep[] = [
  { delayMs: 1000, offsets: cross1 },
  { delayMs: 2000, offsets: square3 },
  { delayMs: 3000, offsets: cross2 },
  { delayMs: 4000, offsets: thickCross2 },
  { delayMs: 5000, offsets: square5Remainder }
];
