import Phaser from "phaser";
import type { RGB } from "./PrimordialSoupTypes";

export interface ColourSource {
  next(): RGB;
}

export class PaletteColourSource implements ColourSource {
  private hexes: string[];

  constructor(hexes: string[]) {
    this.hexes = hexes;
  }

  public next(): RGB {
    const hex = Phaser.Utils.Array.GetRandom(this.hexes);
    const c = Phaser.Display.Color.HexStringToColor(hex);
    return { r: c.red, g: c.green, b: c.blue };
  }
}

export class RandomHSVColourSource implements ColourSource {
  private sMin: number;
  private sMax: number;
  private vMin: number;
  private vMax: number;

  constructor(sMin = 0.65, sMax = 1.0, vMin = 0.75, vMax = 1.0) {
    this.sMin = sMin;
    this.sMax = sMax;
    this.vMin = vMin;
    this.vMax = vMax;
  }

  public next(): RGB {
    const h = Phaser.Math.FloatBetween(0, 360);
    const s = Phaser.Math.FloatBetween(this.sMin, this.sMax);
    const v = Phaser.Math.FloatBetween(this.vMin, this.vMax);

    const c = Phaser.Display.Color.HSVToRGB(h, s, v);
    if (c instanceof Phaser.Display.Color) {
      return { r: c.red, g: c.green, b: c.blue };
    }
    return { r: c.r, g: c.g, b: c.b };
  }
}
