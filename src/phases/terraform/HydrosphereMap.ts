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

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const col = terrainColour(altGrid[r][c], waterLevel);
      gridData.setHex(r, c, toHex(col), 1);
    }
  }
};