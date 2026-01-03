export type HydrosphereCell = {
  a: number;
};

export default class HydrosphereMap {
  public readonly cols: number;
  public readonly rows: number;

  public waterLevel = 0;

  private cells: HydrosphereCell[][];

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.cells = this.generate();
  }

  private generate() {
    const rows = this.rows;
    const cols = this.cols;

    const noise = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.random())
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
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        flat.push(noise[r][c]);
      }
    }
    flat.sort((a, b) => a - b);

    const thresholds: number[] = [];
    for (let i = 1; i < 8; i++) {
      const idx = Math.floor((flat.length * i) / 8);
      thresholds.push(flat[idx]);
    }

    const cells: HydrosphereCell[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ a: 0 }))
    );

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let lvl = 0;
        while (lvl < 7 && noise[r][c] > thresholds[lvl]) lvl++;
        cells[r][c].a = lvl;
      }
    }

    return cells;
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
