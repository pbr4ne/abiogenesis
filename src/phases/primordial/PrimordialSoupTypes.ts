export type RGB = {
  r: number;
  g: number;
  b: number;
};

export type RGBA01 = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export type CellLayer = {
  startAt: number;
  lifeMs: number;
  r: number;
  g: number;
  b: number;
  baseA: number;
  clickable: boolean;
};

export type ActiveCell = {
  row: number;
  col: number;
  layers: CellLayer[];
};

export type BloomStep = {
  delayMs: number;
  offsets: Array<[number, number]>;
};
