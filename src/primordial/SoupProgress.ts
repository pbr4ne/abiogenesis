import Phaser from "phaser";

export type RGB = { r: number; g: number; b: number };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default class SoupProgress {
  private fillR01 = 0;
  private fillG01 = 0;
  private fillB01 = 0;

  private seen: RGB[] = [];

  public get r01() { return this.fillR01; }
  public get g01() { return this.fillG01; }
  public get b01() { return this.fillB01; }

  public get total01() {
    return (this.fillR01 + this.fillG01 + this.fillB01) / 3;
  }

  public absorb(rgb: RGB, amount01 = 0.035) {
    this.fillR01 = clamp01(this.fillR01 + (rgb.r / 255) * amount01);
    this.fillG01 = clamp01(this.fillG01 + (rgb.g / 255) * amount01);
    this.fillB01 = clamp01(this.fillB01 + (rgb.b / 255) * amount01);

    const key = (c: RGB) => ((c.r & 255) << 16) | ((c.g & 255) << 8) | (c.b & 255);
    const k = key(rgb);
    if (!this.seen.some(s => key(s) === k)) this.seen.push({ r: rgb.r, g: rgb.g, b: rgb.b });
  }

  public spawnDelayMs() {
    return Math.round(lerp(1000, 50, this.total01));
  }

  public autoBloomChance01() {
    return lerp(0.0, 0.25, this.total01);
  }

  public mixedColourChance01() {
    return lerp(0.0, 0.75, Math.max(0, (this.total01 - 0.15) / 0.85));
  }

  public pickColour(basePick: () => RGB) {
    if (this.seen.length < 2) return basePick();

    if (Math.random() > this.mixedColourChance01()) return basePick();

    const a = Phaser.Utils.Array.GetRandom(this.seen);
    let b = Phaser.Utils.Array.GetRandom(this.seen);
    for (let i = 0; i < 4 && (b === a); i++) b = Phaser.Utils.Array.GetRandom(this.seen);

    const t = Phaser.Math.FloatBetween(0.25, 0.75);

    return {
      r: Math.round(lerp(a.r, b.r, t)),
      g: Math.round(lerp(a.g, b.g, t)),
      b: Math.round(lerp(a.b, b.b, t))
    };
  }
}
