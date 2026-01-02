import Phaser from "phaser";

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
  private fill: Record<BaseKey, number> = { A: 0, G: 0, T: 0, C: 0 };

  private helixBins: number[] = Array.from({ length: 120 }, () => 0);

  public getFill01(key: BaseKey) {
    return this.fill[key];
  }

  public getTotal01() {
    return (this.fill.A + this.fill.G + this.fill.T + this.fill.C) / 4;
  }

  public spawnDelayMs() {
    return Math.round(Phaser.Math.Linear(1000, 50, this.getTotal01()));
  }

  public autoBloomChance01() {
    return Phaser.Math.Linear(0.01, 0.35, this.getTotal01());
  }

  public onClickColour(rgb: RGB) {
    const base = this.pickNearestBase(rgb);
    this.fill[base] = clamp01(this.fill[base] + 0.05);
  }

  public pickSpawnRGB() {
    const wA = 0.25 + this.fill.A * 1.25;
    const wG = 0.25 + this.fill.G * 1.25;
    const wT = 0.25 + this.fill.T * 1.25;
    const wC = 0.25 + this.fill.C * 1.25;

    const total = wA + wG + wT + wC;
    let r = Math.random() * total;

    let base: BaseKey = "A";
    if ((r -= wA) <= 0) base = "A";
    else if ((r -= wG) <= 0) base = "G";
    else if ((r -= wT) <= 0) base = "T";
    else base = "C";

    const b = BASES.find(x => x.key === base)!.rgb;

    const spread = Phaser.Math.Linear(0, 40, this.fill[base]);
    return {
      r: Phaser.Math.Clamp(Math.round(b.r + Phaser.Math.FloatBetween(-spread, spread)), 0, 255),
      g: Phaser.Math.Clamp(Math.round(b.g + Phaser.Math.FloatBetween(-spread, spread)), 0, 255),
      b: Phaser.Math.Clamp(Math.round(b.b + Phaser.Math.FloatBetween(-spread, spread)), 0, 255)
    };
  }

  public computeHelixBinsFromGrid(getCells: () => Iterable<RGB>) {
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

    if (count <= 0) return;

    for (let i = 0; i < this.helixBins.length; i++) {
      this.helixBins[i] = this.helixBins[i] / count;
    }

    const smooth = this.helixBins.slice();
    const n = this.helixBins.length;

    for (let i = 0; i < n; i++) {
      const a = smooth[(i - 2 + n) % n];
      const b = smooth[(i - 1 + n) % n];
      const c = smooth[i];
      const d = smooth[(i + 1) % n];
      const e = smooth[(i + 2) % n];
      this.helixBins[i] = (a + b + c * 2 + d + e) / 6;
    }
  }

  public helixAlphaForHue01(h01: number) {
    const idx = Math.floor(Phaser.Math.Wrap(h01, 0, 1) * (this.helixBins.length - 1));
    const a = this.helixBins[idx] ?? 0;
    return Phaser.Math.Clamp(Math.pow(a, 0.55), 0, 1);
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
}
