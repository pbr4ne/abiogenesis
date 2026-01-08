import Phaser from "phaser";
import { checkUrlParam } from "../../utilities/GameUtils";

export type RGB = { r: number; g: number; b: number };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

type BaseKey = "A" | "G" | "T" | "C";

const BASES: { key: BaseKey; rgb: RGB }[] = [
  { key: "A", rgb: { r: 255, g: 0, b: 255 } },
  { key: "G", rgb: { r: 255, g: 255, b: 0 } },
  { key: "T", rgb: { r: 0, g: 255, b: 0 } },
  { key: "C", rgb: { r: 0, g: 255, b: 255 } }
];

export default class SoupProgress {
  private clickedCellToken = new Map<string, number>();

  private fill: Record<BaseKey, number> = { A: 0, G: 0, T: 0, C: 0 };

  private helixBins: number[] = Array.from({ length: 120 }, () => 0);

  public getFill01(key: BaseKey) {
    return this.fill[key];
  }

  public getTotal01() {
    return (this.fill.A + this.fill.G + this.fill.T + this.fill.C) / 4;
  }

  public autoBloomChance01() {
    return Phaser.Math.Linear(0.01, 0.35, this.getTotal01());
  }

  public onClickColour(rgb: RGB) {
    const base = this.pickNearestBase(rgb);
    this.fill[base] = clamp01(this.fill[base] + 0.05);
  }

  public computeHelixBinsFromGrid(getCells: () => Iterable<RGB>) {
    if(checkUrlParam("overrideAll", "true")) {
      this.setAllFill01(0.98);
    }
    const prev = this.helixBins.slice();

    this.helixBins.fill(0);

    let count = 0;

    for (const rgb of getCells()) {
      const hsv = Phaser.Display.Color.RGBToHSV(rgb.r, rgb.g, rgb.b) as any;
      const s = hsv.s ?? 0;
      const v = hsv.v ?? 0;
      if (s < 0.08 || v < 0.08) continue;

      const h01 = Phaser.Math.Wrap(hsv.h ?? 0, 0, 1);
      const idx = Math.floor(h01 * (this.helixBins.length - 1));

      this.helixBins[idx] += 1;
      count++;
    }

    if (count <= 0) {
      for (let i = 0; i < this.helixBins.length; i++) {
        this.helixBins[i] = prev[i] * 0.92;
      }
      return;
    }

    for (let i = 0; i < this.helixBins.length; i++) {
      this.helixBins[i] = this.helixBins[i] / count;
    }

    const smooth = this.helixBins.slice();
    const n = this.helixBins.length;

    const smoothStrength = Phaser.Math.Clamp(Phaser.Math.Linear(1.0, 3.5, 1 - Phaser.Math.Clamp(count / 120, 0, 1)), 1.0, 3.5);

    for (let pass = 0; pass < Math.round(smoothStrength); pass++) {
      for (let i = 0; i < n; i++) {
        const a = smooth[(i - 2 + n) % n];
        const b = smooth[(i - 1 + n) % n];
        const c = smooth[i];
        const d = smooth[(i + 1) % n];
        const e = smooth[(i + 2) % n];
        this.helixBins[i] = (a + b + c * 2 + d + e) / 6;
      }
      for (let i = 0; i < n; i++) smooth[i] = this.helixBins[i];
    }

    const t = Phaser.Math.Clamp(count / 220, 0, 1);
    const lerp = Phaser.Math.Linear(0.12, 0.55, t);

    for (let i = 0; i < n; i++) {
      this.helixBins[i] = Phaser.Math.Linear(prev[i], this.helixBins[i], lerp);
    }
  }

  public helixAlphaForHue01(h01: number) {
    const idx = Math.floor(Phaser.Math.Wrap(h01, 0, 1) * (this.helixBins.length - 1));
    const a = this.helixBins[idx] ?? 0;

    if (a < 0.001) return 0;

    const k = 70;
    const boosted01 = Math.log1p(k * a) / Math.log1p(k);

    const maxDynamic = 0.92;

    return Phaser.Math.Clamp(boosted01 * maxDynamic, 0, maxDynamic);
  }

  private pickNearestBase(rgb: RGB): BaseKey {
    let best: BaseKey = "A";
    let bestD = Infinity;

    for (const b of BASES) {
      const dr = rgb.r - b.rgb.r;
      const dg = rgb.g - b.rgb.g;
      const db = rgb.b - b.rgb.b;
      const d = dr * dr + dg * dg + db * db;

      if (d < bestD) {
        bestD = d;
        best = b.key;
      }
    }

    return best;
  }

  public get avg01() {
    return (this.fill.A + this.fill.G + this.fill.T + this.fill.C) / 4;
  }

  public get min01() {
    return Math.min(this.fill.A, this.fill.G, this.fill.T, this.fill.C);
  }

  public spawnDelayMs() {
    return Math.round(Phaser.Math.Linear(1000, 25, this.avg01));
  }

  public spawnBloomChance01() {
    return Phaser.Math.Clamp(this.avg01, 0, 1);
  }

  private baseWeights() {
    return {
      A: 0.25 + this.fill.A * 1.0,
      G: 0.25 + this.fill.G * 1.0,
      T: 0.25 + this.fill.T * 1.0,
      C: 0.25 + this.fill.C * 1.0
    };
  }

  private pickBaseKey(): "A" | "G" | "T" | "C" {
    const w = this.baseWeights();
    const total = w.A + w.G + w.T + w.C;
    let r = Math.random() * total;

    if ((r -= w.A) <= 0) return "A";
    if ((r -= w.G) <= 0) return "G";
    if ((r -= w.T) <= 0) return "T";
    return "C";
  }

  private baseRGBFor(key: "A" | "G" | "T" | "C") {
    if (key === "A") return { r: 255, g: 0, b: 255 };
    if (key === "G") return { r: 255, g: 255, b: 0 };
    if (key === "T") return { r: 0, g: 255, b: 0 };
    return { r: 0, g: 255, b: 255 };
  }

  public pickSpawnRGB() {
    const rainbowChance = Phaser.Math.Clamp(this.min01, 0, 1);

    if (Math.random() < rainbowChance) {
      const h = Math.random();
      const s = 1;
      const v = 1;
      const c = Phaser.Display.Color.HSVToRGB(h, s, v) as Phaser.Types.Display.ColorObject;
      return { r: c.r, g: c.g, b: c.b };
    }

    const key = this.pickBaseKey();
    const base = this.baseRGBFor(key);
    const baseFill = this.fill[key];

    const hsv = Phaser.Display.Color.RGBToHSV(base.r, base.g, base.b) as any;
    const h0 = hsv.h ?? 0;
    const s0 = hsv.s ?? 1;
    const v0 = hsv.v ?? 1;

    const hueSpread = Phaser.Math.Linear(0.03, 0.14, Phaser.Math.Clamp(baseFill, 0, 1));
    const satWobble = Phaser.Math.Linear(0.00, 0.08, baseFill);
    const valWobble = Phaser.Math.Linear(0.00, 0.06, baseFill);

    const h = Phaser.Math.Wrap(h0 + Phaser.Math.FloatBetween(-hueSpread, hueSpread), 0, 1);
    const s = Phaser.Math.Clamp(s0 + Phaser.Math.FloatBetween(-satWobble, satWobble), 0, 1);
    const v = Phaser.Math.Clamp(v0 + Phaser.Math.FloatBetween(-valWobble, valWobble), 0, 1);

    const c = Phaser.Display.Color.HSVToRGB(h, s, v) as Phaser.Types.Display.ColorObject;
    return { r: c.r, g: c.g, b: c.b };
  }

  public setAllFill01(v01: number) {
    const v = Phaser.Math.Clamp(v01, 0, 1);
    this.fill.A = v;
    this.fill.G = v;
    this.fill.T = v;
    this.fill.C = v;
  }

  public isAllZero() {
    return this.fill.A <= 0 && this.fill.G <= 0 && this.fill.T <= 0 && this.fill.C <= 0;
  }

  public isEffectivelyComplete() {
    return this.avg01 >= 0.99;
  }

  public getGATC01() {
    return {
      A: this.fill.A,
      G: this.fill.G,
      T: this.fill.T,
      C: this.fill.C
    };
  }

  private keyOf(row: number, col: number) {
    return `${row},${col}`;
  }

  public tryConsumeCellClick(row: number, col: number, token: number) {
    const k = this.keyOf(row, col);
    const last = this.clickedCellToken.get(k);

    if (last === token) return false;

    this.clickedCellToken.set(k, token);
    return true;
  }
}
