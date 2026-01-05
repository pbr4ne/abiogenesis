import Phaser from "phaser";

export type AltGrid = number[][];

export const enforceGlobalAltSplit5050 = (
  altGrid: number[][],
  splitAlt = 10,
  levels = 20,
  rng: Phaser.Math.RandomDataGenerator
) => {
  const rows = altGrid.length;
  const cols = altGrid[0].length;

  const all: { r: number; c: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      all.push({ r, c });
    }
  }

  const targetHigh = Math.floor(all.length * 0.5);

  let curHigh = 0;
  for (const { r, c } of all) {
    if (altGrid[r][c] >= splitAlt) curHigh++;
  }

  if (curHigh === targetHigh) return;

  const highs: { r: number; c: number }[] = [];
  const lows: { r: number; c: number }[] = [];

  for (const rc of all) {
    if (altGrid[rc.r][rc.c] >= splitAlt) highs.push(rc);
    else lows.push(rc);
  }

  Phaser.Utils.Array.Shuffle(highs);
  Phaser.Utils.Array.Shuffle(lows);

  const randInt = (min: number, max: number) => Math.floor(rng.frac() * (max - min + 1)) + min;

  if (curHigh > targetHigh) {
    let need = curHigh - targetHigh;
    for (let i = 0; need > 0 && i < highs.length; i++) {
      const { r, c } = highs[i];
      altGrid[r][c] = randInt(0, splitAlt - 1);
      need--;
    }
  } else {
    let need = targetHigh - curHigh;
    for (let i = 0; need > 0 && i < lows.length; i++) {
      const { r, c } = lows[i];
      altGrid[r][c] = randInt(splitAlt, levels - 1);
      need--;
    }
  }
};

export const generateAltGrid = (
  rows: number,
  cols: number,
  rng: Phaser.Math.RandomDataGenerator,
  levels = 20
): AltGrid => {
  const noise = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => rng.frac())
  );

  const passes = 4;
  for (let p = 0; p < passes; p++) {
    const next = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let sum = 0;
        let n = 0;

        for (let dr = -1; dr <= 1; dr++) {
          const rr = r + dr;
          if (rr < 0 || rr >= rows) continue;

          for (let dc = -1; dc <= 1; dc++) {
            const cc = (c + dc + cols) % cols;
            sum += noise[rr][cc];
            n++;
          }
        }

        next[r][c] = sum / n;
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        noise[r][c] = next[r][c];
      }
    }
  }

  const flat: number[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) flat.push(noise[r][c]);
  flat.sort((a, b) => a - b);

  const thresholds: number[] = [];
  for (let i = 1; i < levels; i++) {
    const idx = Math.floor((flat.length * i) / levels);
    thresholds.push(flat[idx]);
  }

  const alt: AltGrid = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let lvl = 0;
      while (lvl < levels - 1 && noise[r][c] > thresholds[lvl]) lvl++;
      alt[r][c] = lvl;
    }
  }

  return alt;
};

export const lerpColour = (a: number, b: number, t: number) => {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;

  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;

  return (
    (Math.round(Phaser.Math.Linear(ar, br, t)) << 16) |
    (Math.round(Phaser.Math.Linear(ag, bg, t)) << 8) |
    Math.round(Phaser.Math.Linear(ab, bb, t))
  );
};

export const terrainColour = (alt: number, waterLevel: number) => {
  const LAND_LEVELS = 20;
  const split = 10;

  const LAND_LOW_START = 0x2a1f16;
  const LAND_LOW_END = 0x4a3726;

  const LAND_HIGH_START = 0x6a4d36;
  const LAND_HIGH_END = 0xc9aa74;

  let landCol: number;

  if (alt < split) {
    const t0 = Phaser.Math.Clamp(alt / (split - 1), 0, 1);
    const tt0 = Phaser.Math.Clamp(Math.pow(t0, 1.35), 0, 1);
    landCol = lerpColour(LAND_LOW_START, LAND_LOW_END, tt0);
  } else {
    const t1 = Phaser.Math.Clamp((alt - split) / ((LAND_LEVELS - 1) - split), 0, 1);
    const tt1 = Phaser.Math.Clamp(Math.pow(t1, 0.70), 0, 1);
    landCol = lerpColour(LAND_HIGH_START, LAND_HIGH_END, tt1);
  }

  if (waterLevel <= 0) return landCol;
  if (alt >= waterLevel) return landCol;

  const depth = waterLevel - alt;
  const t = Phaser.Math.Clamp((depth - 1) / 6, 0, 1);
  const tt = t * t * t;

  const WATER_SHALLOW = 0x3090f0;
  const WATER_DEEP = 0x055cb3;

  return lerpColour(WATER_SHALLOW, WATER_DEEP, tt);
};

export const toHex = (col: number) =>
  "#" + col.toString(16).padStart(6, "0");
