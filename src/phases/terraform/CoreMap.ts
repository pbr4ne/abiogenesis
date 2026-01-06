import Phaser from "phaser";
import { enforceGlobalAltSplit5050, generateAltGrid } from "./HydrosphereTerrain";

export type CoreCell = {
  a: number;
  inHole: boolean;
  depth01: number;
};

export default class CoreMap {
  public readonly cols: number;
  public readonly rows: number;

  private cells: CoreCell[][];

  private holeCx: number;
  private holeCy: number;
  private holeR: number;

  constructor(
    cols: number,
    rows: number,
    opts?: {
      levels?: number;
      holeRadiusCells?: number;
      holeCenter?: { c: number; r: number };
      seed?: string;
    }
  ) {
    this.cols = cols;
    this.rows = rows;

    const levels = opts?.levels ?? 20;

    const rng = opts?.seed
      ? new Phaser.Math.RandomDataGenerator([opts.seed])
      : new Phaser.Math.RandomDataGenerator();

    const alt = generateAltGrid(rows, cols, rng, levels);
    enforceGlobalAltSplit5050(alt, Math.floor(levels / 2), levels, rng);

    this.cells = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        a: alt[r][c],
        inHole: false,
        depth01: 0
      }))
    );

    this.holeCx = opts?.holeCenter?.c ?? (cols / 2);
    this.holeCy = opts?.holeCenter?.r ?? (rows / 2);

    this.holeR = (opts?.holeRadiusCells ?? Math.min(cols, rows) * 0.22) + 0.15;

    this.applyHole(levels);
  }

  public getAltitude(r: number, c: number) {
    return this.cells[r][c].a;
  }

  public isHole(r: number, c: number) {
    return this.cells[r][c].inHole;
  }

  public getHoleDepth01(r: number, c: number) {
    return this.cells[r][c].depth01;
  }

  public getHoleInfo() {
    return { r: this.holeR, cx: this.holeCx, cy: this.holeCy };
  }

  public getRingCells(ringOffset = 1, ringThickness = 2) {
    const out: { r: number; c: number }[] = [];

    const inner = this.holeR + ringOffset;
    const outer = inner + Math.max(0.001, ringThickness);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const d = this.distCells(r, c);
        if (d >= inner && d < outer) out.push({ r, c });
      }
    }

    return out;
  }

  public getHoleInnerEdgeCells(useDiagonals = true) {
    const out: { r: number; c: number }[] = [];

    const dirs4 = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ];

    const dirs8 = [
      ...dirs4,
      { dr: -1, dc: -1 },
      { dr: -1, dc: 1 },
      { dr: 1, dc: -1 },
      { dr: 1, dc: 1 },
    ];

    const dirs = useDiagonals ? dirs8 : dirs4;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.cells[r][c].inHole) continue;

        let touchesOutside = false;

        for (const { dr, dc } of dirs) {
          const rr = r + dr;
          const cc = c + dc;

          if (rr < 0 || rr >= this.rows) continue;
          if (cc < 0 || cc >= this.cols) continue;

          if (!this.cells[rr][cc].inHole) {
            touchesOutside = true;
            break;
          }
        }

        if (touchesOutside) out.push({ r, c });
      }
    }

    return out;
  }

  private distCells(r: number, c: number) {
    const dx = (c + 0.5) - this.holeCx;
    const dy = (r + 0.5) - this.holeCy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private applyHole(levels: number) {
    const r0 = this.holeR;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const d = this.distCells(r, c);

        if (d > r0 - 0.05) continue;

        const t = Phaser.Math.Clamp(1 - d / r0, 0, 1);

        const depth = Phaser.Math.Easing.Quadratic.In(t);

        const maxHoleAlt = Math.floor(levels * 0.18);
        const minHoleAlt = 0;

        const holeAlt = Math.round(Phaser.Math.Linear(maxHoleAlt, minHoleAlt, depth));

        this.cells[r][c].a = holeAlt;
        this.cells[r][c].inHole = true;
        this.cells[r][c].depth01 = depth;
      }
    }
  }
}
