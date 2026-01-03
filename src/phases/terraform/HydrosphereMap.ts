import { generateAltGrid } from "./HydrosphereTerrain";

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
    this.alt = generateAltGrid(rows, cols);

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
