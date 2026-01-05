import { enforceGlobalAltSplit5050, generateAltGrid } from "./HydrosphereTerrain";
import { terrainColour, toHex } from "./HydrosphereTerrain";
import PlanetGrid from "../../planet/PlanetGrid";

export type HydrosphereCell = {
  a: number;
};

export default class HydrosphereMap {
  public readonly cols: number;
  public readonly rows: number;

  public waterLevel = 0;

  private cells: HydrosphereCell[][];
  private alt: number[][];

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    const rng = new Phaser.Math.RandomDataGenerator();
    this.alt = generateAltGrid(rows, cols, rng, 20);
    enforceGlobalAltSplit5050(this.alt, 10, 20, rng);

    this.cells = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({ a: this.alt[r][c] }))
    );
  }

  public getAltitude(row: number, col: number) {
    return this.cells[row][col].a;
  }

  public getLowCellsInRect(row0Start: number, row0End: number, col0Start: number, col0End: number, maxAltInclusive: number) {
    const out: { r: number; c: number }[] = [];

    for (let r = row0Start; r <= row0End; r++) {
      for (let c = col0Start; c <= col0End; c++) {
        if (this.cells[r][c].a <= maxAltInclusive) {
          out.push({ r, c });
        }
      }
    }

    return out;
  }

  public ensureAtLeastLowCellsInRect(row0Start: number, row0End: number, col0Start: number, col0End: number, maxAltInclusive: number, minCount: number) {
    let low = this.getLowCellsInRect(row0Start, row0End, col0Start, col0End, maxAltInclusive);
    if (low.length >= minCount) return;

    const candidates: { r: number; c: number }[] = [];

    for (let r = row0Start; r <= row0End; r++) {
      for (let c = col0Start; c <= col0End; c++) {
        if (this.cells[r][c].a > maxAltInclusive) {
          candidates.push({ r, c });
        }
      }
    }

    Phaser.Utils.Array.Shuffle(candidates);

    let i = 0;
    while (low.length < minCount && i < candidates.length) {
      const { r, c } = candidates[i++];
      this.cells[r][c].a = Phaser.Math.Between(0, maxAltInclusive);
      low.push({ r, c });
    }
  }
}

export const paintHydrosphere = (gridData: PlanetGrid, altGrid: number[][], waterLevel: number) => {
  const rows = altGrid.length;
  const cols = altGrid[0].length;

  const wl = Phaser.Math.Clamp(waterLevel, 0, 20);

  const maxFrac = 0.22;
  const maxRows = Math.max(1, Math.floor(rows * maxFrac));
  const iceRows = Phaser.Math.Clamp(Math.floor((wl / 20) * maxRows), 0, maxRows);

  const blendToWhite = (baseHex: number, t: number) => {
    const tr = Phaser.Math.Clamp(t, 0, 1);

    const br = (baseHex >> 16) & 0xff;
    const bg = (baseHex >> 8) & 0xff;
    const bb = baseHex & 0xff;

    const r = Math.round(Phaser.Math.Linear(br, 255, tr));
    const g = Math.round(Phaser.Math.Linear(bg, 255, tr));
    const b = Math.round(Phaser.Math.Linear(bb, 255, tr));

    return (r << 16) | (g << 8) | b;
  };

  const hash01 = (n: number) => {
    let x = n | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 100000) / 100000;
  };

  const edgeJitterMax = Math.max(1, Math.floor(iceRows * 0.22));

  const seed = 1337;
  const edgeJitter: number[] = Array.from({ length: cols }, (_, c) => {
    if (iceRows <= 0) return 0;
    const n = hash01(seed + c * 1013);
    return Math.round((n * 2 - 1) * edgeJitterMax);
  });

  const waterWhite = 0.75;
  const landWhite = 0.75;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const alt = altGrid[r][c];
      const baseHex = terrainColour(alt, wl);

      if (iceRows <= 0) {
        gridData.setHex(r, c, toHex(baseHex), 1);
        continue;
      }

      const dPole = Math.min(r, rows - 1 - r);

      const bandDepth = Phaser.Math.Clamp(iceRows + edgeJitter[c], 0, iceRows + edgeJitterMax);

      const inCap = bandDepth > 0 && dPole < bandDepth;

      if (!inCap) {
        gridData.setHex(r, c, toHex(baseHex), 1);
        continue;
      }

      const isWater = wl > 0 && alt < wl;

      const t = isWater ? waterWhite : landWhite;

      const outHex = blendToWhite(baseHex, t);
      gridData.setHex(r, c, toHex(outHex), 1);
    }
  }
};
