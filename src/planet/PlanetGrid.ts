import Phaser from "phaser";
import { log } from "../utilities/GameUtils";

export default class PlanetGrid {
  public readonly divisions: number;

  private colours: string[][];
  private revealed: boolean[][];

  constructor(divisions: number, colours?: string[][]) {
    this.divisions = divisions;
    this.colours = colours ?? Array.from({ length: divisions }, () =>
      Array.from({ length: divisions }, () => "#000000")
    );
    this.revealed = Array.from({ length: divisions }, () =>
      Array.from({ length: divisions }, () => false)
    );
  }

  public isRevealed(row: number, col: number) {
    return this.revealed[row][col];
  }

  public getColour(row: number, col: number) {
    return this.colours[row][col];
  }

  public setColour(row: number, col: number, hex: string, reveal = true) {
    this.colours[row][col] = hex;
    if (reveal) this.revealed[row][col] = true;
  }

  public forEachRevealed(fn: (row: number, col: number, hex: string) => void) {
    for (let row = 0; row < this.divisions; row++) {
      for (let col = 0; col < this.divisions; col++) {
        if (!this.revealed[row][col]) {
            continue;
        }
        fn(row, col, this.colours[row][col]);
      }
    }
  }

  public averageRevealedRGB(): { r: number; g: number; b: number } | null {
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let n = 0;

    this.forEachRevealed((_row, _col, hex) => {
      const c = Phaser.Display.Color.HexStringToColor(hex);
      rSum += c.red;
      gSum += c.green;
      bSum += c.blue;
      n++;
    });

    if (n === 0) {
        return null;
    }

    log(`Average revealed colour RGB: (${Math.round(rSum / n)}, ${Math.round(gSum / n)}, ${Math.round(bSum / n)})`);

    return {
      r: Math.round(rSum / n),
      g: Math.round(gSum / n),
      b: Math.round(bSum / n),
    };
  }

  public getColoursRef() {
    return this.colours;
  }

  public getRevealedRef() {
    return this.revealed;
  }
}
