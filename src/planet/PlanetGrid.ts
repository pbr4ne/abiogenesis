import Phaser from "phaser";

export type RGBA = { r: number; g: number; b: number; a: number };

export default class PlanetGrid {
  public readonly divisions: number;

  private cells: RGBA[][];

  constructor(divisions: number) {
    this.divisions = divisions;

    this.cells = Array.from({ length: divisions }, () =>
      Array.from({ length: divisions }, () => ({ r: 0, g: 0, b: 0, a: 0 }))
    );
  }

  public getCell(row: number, col: number): RGBA {
    return this.cells[row][col];
  }

  public setCell(row: number, col: number, rgba: RGBA) {
    this.cells[row][col] = {
      r: Phaser.Math.Clamp(Math.round(rgba.r), 0, 255),
      g: Phaser.Math.Clamp(Math.round(rgba.g), 0, 255),
      b: Phaser.Math.Clamp(Math.round(rgba.b), 0, 255),
      a: Phaser.Math.Clamp(rgba.a, 0, 1),
    };
  }

  public setHex(row: number, col: number, hex: string, a = 1) {
    const c = Phaser.Display.Color.HexStringToColor(hex);
    this.setCell(row, col, { r: c.red, g: c.green, b: c.blue, a });
  }

  public getAlpha(row: number, col: number) {
    return this.cells[row][col].a;
  }

  public addVolumeHex(row: number, col: number, hex: string, aAdd: number) {
    const add = Phaser.Display.Color.HexStringToColor(hex);
    this.addVolumeRGBA(row, col, { r: add.red, g: add.green, b: add.blue, a: Phaser.Math.Clamp(aAdd, 0, 1) });
  }

  public addVolumeRGBA(row: number, col: number, add: RGBA) {
    const cur = this.cells[row][col];

    const a1 = cur.a;
    const a2 = Phaser.Math.Clamp(add.a, 0, 1);
    const aOut = Phaser.Math.Clamp(a1 + a2, 0, 1);

    if (aOut <= 0) {
      this.cells[row][col] = { r: 0, g: 0, b: 0, a: 0 };
      return;
    }

    const w1 = a1 / aOut;
    const w2 = a2 / aOut;

    this.cells[row][col] = {
      r: Math.round(cur.r * w1 + add.r * w2),
      g: Math.round(cur.g * w1 + add.g * w2),
      b: Math.round(cur.b * w1 + add.b * w2),
      a: aOut,
    };
  }

  public forEachNonZero(fn: (row: number, col: number, cell: RGBA) => void) {
    for (let row = 0; row < this.divisions; row++) {
      for (let col = 0; col < this.divisions; col++) {
        const cell = this.cells[row][col];
        if (cell.a <= 0) continue;
        fn(row, col, cell);
      }
    }
  }

  public averageRGBWeightedByAlpha(): { r: number; g: number; b: number } | null {
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let aSum = 0;

    this.forEachNonZero((_row, _col, c) => {
      rSum += c.r * c.a;
      gSum += c.g * c.a;
      bSum += c.b * c.a;
      aSum += c.a;
    });

    if (aSum <= 0) {
      return null;
    }

    return {
      r: Math.round(rSum / aSum),
      g: Math.round(gSum / aSum),
      b: Math.round(bSum / aSum),
    };
  }

  public getCellsRef() {
    return this.cells;
  }
}
