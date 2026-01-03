import Phaser from "phaser";

export type AltGrid = number[][];

export const generateAltGrid = (rows: number, cols: number, rng: Phaser.Math.RandomDataGenerator): AltGrid => {
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
          for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr;
            const cc = c + dc;
            if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
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
  for (let i = 1; i < 8; i++) {
    const idx = Math.floor((flat.length * i) / 8);
    thresholds.push(flat[idx]);
  }

  const alt: AltGrid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let lvl = 0;
      while (lvl < 7 && noise[r][c] > thresholds[lvl]) lvl++;
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
  const landCol = lerpColour(0x3a2f23, 0xc2a46a, alt / 7);

  if (alt >= waterLevel) return landCol;

  const depth = waterLevel - alt;
  const t = Phaser.Math.Clamp((depth - 1) / 6, 0, 1);
  const tt = t * t * t;

  return lerpColour(0x6fe6ff, 0x000f4a, tt);
};

export const toHex = (col: number) =>
  "#" + col.toString(16).padStart(6, "0");
