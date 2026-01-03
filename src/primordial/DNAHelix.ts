import Phaser from "phaser";
import { log } from "../utilities/GameUtils";
import SoupProgress from "./SoupProgress";

type DNAHelixConfig = {
  height?: number;
  amp?: number;
  centerGap?: number;
  turns?: number;
  strandWidth?: number;
  rungWidth?: number;
  rungEveryPx?: number;
  stepsPx?: number;
};

type HelixGeom = {
  topY: number;
  botY: number;
  freq: number;
};

export default class DNAHelix extends Phaser.GameObjects.Container {
  private g: Phaser.GameObjects.Graphics;

  private dnaHeight: number;
  private amp: number;
  private centerGap: number;
  private turns: number;
  private strandWidth: number;
  private stepsPx: number;
  private progress?: SoupProgress;
  private revealed: { r: number; g: number; b: number; w: number }[] = [];
  private unlockedHues: { h: number; w: number }[] = [];
  private phase = 0;
  private debugText?: Phaser.GameObjects.Text;
  private debugEnabled = false;

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: DNAHelixConfig = {}) {
    super(scene, x, y);

    this.dnaHeight = cfg.height ?? 768;
    this.amp = cfg.amp ?? 44;
    this.centerGap = cfg.centerGap ?? 26;
    this.turns = cfg.turns ?? 3.2;
    this.strandWidth = cfg.strandWidth ?? 4;
    this.stepsPx = cfg.stepsPx ?? 1;

    this.g = scene.add.graphics();
    this.add(this.g);

    this.drawHelix();

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    });

    if (this.debugEnabled) {
      this.debugText = scene.add.text(-1500, 0, "", {
        fontFamily: "monospace",
        fontSize: "24px"
      });
      this.debugText.setDepth(9999);
      this.add(this.debugText);
    }
  }

  public pickRevealedGradientRGB() {
    if (this.revealed.length === 0) return null;

    const topY = this.getTopY();
    const botY = this.getBotY();

    const colorAtY = (y: number) => {
      const t = Phaser.Math.Clamp((y - topY) / (botY - topY), 0, 1);
      const hue01 = Phaser.Math.Linear(0, 0.75, t);
      return Phaser.Display.Color.HSVToRGB(hue01, 1, 1) as Phaser.Types.Display.ColorObject;
    };

    const revealAlphaAtY = (y: number) => {
      const c = colorAtY(y);
      let best = 0;

      for (const s of this.revealed) {
        const dr = (c.r - s.r) / 255;
        const dg = (c.g - s.g) / 255;
        const db = (c.b - s.b) / 255;

        const d = Math.sqrt(dr * dr + dg * dg + db * db);
        const sim = Phaser.Math.Clamp(1 - d / 0.65, 0, 1);

        const w = Phaser.Math.Clamp(s.w / 6, 0.15, 1);
        best = Math.max(best, sim * w);
      }

      return Phaser.Math.Clamp(Math.pow(best, 1.6), 0, 1);
    };

    for (let tries = 0; tries < 18; tries++) {
      const y = Phaser.Math.FloatBetween(topY, botY);
      const a = revealAlphaAtY(y);
      if (Math.random() > a) continue;

      const c = colorAtY(y);
      return { r: c.r, g: c.g, b: c.b };
    }

    return null;
  }

  private addRevealPoint(rgb: { r: number; g: number; b: number }, w: number) {
    const close = (a: any, b: any) =>
      Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < 30;

    const found = this.revealed.find(c => close(c, rgb));
    if (found) found.w += w;
    else this.revealed.push({ r: rgb.r, g: rgb.g, b: rgb.b, w });
  }

  private lerpRGB(a: any, b: any, t: number) {
    return {
      r: Math.round(Phaser.Math.Linear(a.r, b.r, t)),
      g: Math.round(Phaser.Math.Linear(a.g, b.g, t)),
      b: Math.round(Phaser.Math.Linear(a.b, b.b, t))
    };
  }

  public addRevealColour(rgb: { r: number; g: number; b: number }, weight = 1) {
    this.addRevealPoint(rgb, weight);

    const rOnly = { r: rgb.r, g: 0, b: 0 };
    const gOnly = { r: 0, g: rgb.g, b: 0 };
    const bOnly = { r: 0, g: 0, b: rgb.b };

    const rOn = rgb.r > 32;
    const gOn = rgb.g > 32;
    const bOn = rgb.b > 32;

    if (rOn) this.addRevealPoint(rOnly, weight * 0.25);
    if (gOn) this.addRevealPoint(gOnly, weight * 0.25);
    if (bOn) this.addRevealPoint(bOnly, weight * 0.25);

    const ts = [0.25, 0.5, 0.75];

    if (rOn) for (const t of ts) this.addRevealPoint(this.lerpRGB(rgb, rOnly, t), weight * 0.14);
    if (gOn) for (const t of ts) this.addRevealPoint(this.lerpRGB(rgb, gOnly, t), weight * 0.14);
    if (bOn) for (const t of ts) this.addRevealPoint(this.lerpRGB(rgb, bOnly, t), weight * 0.14);
  }

  public hasUnlockedSpawnColours() {
    return this.unlockedHues.length > 0;
  }

  public pickUnlockedSpawnRGB() {
    if (this.unlockedHues.length === 0) return null;

    const total = this.unlockedHues.reduce((s, x) => s + x.w, 0);
    let roll = Math.random() * total;
    let picked = this.unlockedHues[0];

    for (const x of this.unlockedHues) {
      roll -= x.w;
      if (roll <= 0) {
        picked = x;
        break;
      }
    }

    const spread = Phaser.Math.Clamp(0.015 + 0.06 * (picked.w / (picked.w + 6)), 0.015, 0.075);
    const h = Phaser.Math.Wrap(picked.h + Phaser.Math.FloatBetween(-spread, spread), 0, 1);

    const c = Phaser.Display.Color.HSVToRGB(h, 1, 1) as Phaser.Types.Display.ColorObject;
    return { r: c.r, g: c.g, b: c.b };
  }

  public clearReveal() {
    this.revealed = [];
  }

  private onUpdate = (_t: number, dt: number) => {
    this.phase += dt * 0.0012;
    this.drawHelix();
  };

  private getGeom(): HelixGeom {
    return {
      topY: -this.dnaHeight / 2,
      botY: this.dnaHeight / 2,
      freq: (this.turns * Math.PI * 2) / this.dnaHeight
    };
  }

  private xAAtY(y: number, geom: HelixGeom) {
    const s = Math.sin((y - geom.topY) * geom.freq + this.phase);
    return -this.centerGap / 2 + s * this.amp;
  }

  private xBAtY(y: number, geom: HelixGeom) {
    const s = Math.sin((y - geom.topY) * geom.freq + this.phase + Math.PI);
    return this.centerGap / 2 + s * this.amp;
  }

  private hue01AtY(y: number, geom: HelixGeom) {
    const t = Phaser.Math.Clamp((y - geom.topY) / (geom.botY - geom.topY), 0, 1);
    return Phaser.Math.Linear(0, 0.75, t);
  }

  private packedColourAtHue01(hue01: number) {
    const c = Phaser.Display.Color.HSVToRGB(hue01, 1, 1) as Phaser.Types.Display.ColorObject;
    return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
  }

  private strandAlphaAtY(y: number, geom: HelixGeom) {
    const z = Math.cos((y - geom.topY) * geom.freq + this.phase);
    return Phaser.Math.Clamp(0.25 + 0.75 * ((z + 1) / 2), 0.25, 1);
  }

  private rungAlphaAtY(y: number, geom: HelixGeom) {
    const widthHere = Math.abs(this.xBAtY(y, geom) - this.xAAtY(y, geom));
    const minW = this.centerGap;
    const maxW = this.centerGap + this.amp * 2;
    const w01 = Phaser.Math.Clamp((widthHere - minW) / (maxW - minW), 0, 1);
    return 0.25 + 0.55 * Math.pow(w01, 0.8);
  }

  private ribbonInnerQuadAtY(y: number, y2: number, geom: HelixGeom) {
    const ax1 = this.xAAtY(y, geom);
    const bx1 = this.xBAtY(y, geom);
    const ax2 = this.xAAtY(y2, geom);
    const bx2 = this.xBAtY(y2, geom);

    const mid1 = (ax1 + bx1) / 2;
    const mid2 = (ax2 + bx2) / 2;

    const w1 = Math.abs(bx1 - ax1);
    const w2 = Math.abs(bx2 - ax2);

    const minW = Math.min(w1, w2);
    const minInner = this.strandWidth + 3;
    const innerW = Phaser.Math.Clamp(minW, minInner, minW - minInner);

    if (innerW <= 0) return null;

    return {
      left1: mid1 - innerW / 2,
      right1: mid1 + innerW / 2,
      left2: mid2 - innerW / 2,
      right2: mid2 + innerW / 2
    };
  }

  private ribbonAlphaForHue01(hue01: number) {
    if (!this.progress) return 0;

    const p = this.progress.min01;

    if (p >= 0.99) return 1;

    if (p <= 0) return 0;

    const contentA = this.progress.helixAlphaForHue01(hue01);
    if (contentA <= 0.001) return 0;

    const vis = this.smoothstep(0.70, 0.99, p);
    const floor = Phaser.Math.Linear(0.10, 0.55, this.smoothstep(0.85, 0.99, p));

    const boosted = this.clamp01(contentA * (1 + 6 * Math.pow(p, 3)));
    const lifted = Math.max(boosted * vis, floor);

    const snapT = this.smoothstep(0.95, 0.99, p);

    return Phaser.Math.Linear(lifted, 1, snapT);
  }

  private drawDebugOverlay() {
    if (!this.debugText || !this.progress) return;

    const p = this.progress.min01;
    const snapStart = 0.97;
    const snapFull = 0.99;
    const snapT = this.smoothstep(snapStart, snapFull, p);

    const vis = Phaser.Math.Clamp((p - 0.03) / 0.96, 0, 1);

    const gatc = this.progress.getGATC01();

    const testHues = [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6];

    const lines: string[] = [];
    lines.push(`A=${gatc.A.toFixed(3)} G=${gatc.G.toFixed(3)} T=${gatc.T.toFixed(3)} C=${gatc.C.toFixed(3)}`);
    lines.push(`min01=${p.toFixed(4)} snapT=${snapT.toFixed(3)} (>=${snapFull}? ${p >= snapFull})`);
    lines.push(`vis=${vis.toFixed(3)}`);

    for (const h01 of testHues) {
      const contentA = this.progress.helixAlphaForHue01(h01);
      const dyn = (contentA * vis).toFixed(3);
      lines.push(`${this.hueName(h01).padEnd(7)} contentA=${contentA.toFixed(3)} dyn=${dyn}`);
    }

    this.debugText.setText(lines.join("\n"));
  }

  private drawRibbon(g: Phaser.GameObjects.Graphics, geom: HelixGeom) {
    for (let y = geom.topY; y < geom.botY; y += this.stepsPx) {
      const y2 = Math.min(y + this.stepsPx, geom.botY);

      const quad = this.ribbonInnerQuadAtY(y, y2, geom);
      if (!quad) continue;

      const midY = (y + y2) / 2;
      const hue01 = this.hue01AtY(midY, geom);
      const packed = this.packedColourAtHue01(hue01);

      const a = this.ribbonAlphaForHue01(hue01);
      if (a <= 0.001) continue;

      g.fillStyle(packed, a);
      g.beginPath();
      g.moveTo(quad.left1, y);
      g.lineTo(quad.right1, y);
      g.lineTo(quad.right2, y2);
      g.lineTo(quad.left2, y2);
      g.closePath();
      g.fillPath();
    }
  }

  private drawRungs(g: Phaser.GameObjects.Graphics, geom: HelixGeom) {
    const rungCount = 30;

    for (let i = 0; i < rungCount; i++) {
      const t = i / (rungCount - 1);
      const y = Phaser.Math.Linear(geom.topY, geom.botY, t);

      const ax = this.xAAtY(y, geom);
      const bx = this.xBAtY(y, geom);
      const a = this.rungAlphaAtY(y, geom);

      g.lineStyle(9, 0x000000, a);
      g.beginPath();
      g.moveTo(ax, y);
      g.lineTo(bx, y);
      g.strokePath();

      g.lineStyle(3, 0xffffff, a);
      g.beginPath();
      g.moveTo(ax, y);
      g.lineTo(bx, y);
      g.strokePath();
    }
  }

  private drawStrands(g: Phaser.GameObjects.Graphics, geom: HelixGeom) {
    for (let y = geom.topY; y < geom.botY; y += this.stepsPx) {
      const y2 = Math.min(y + this.stepsPx, geom.botY);

      const a1 = this.strandAlphaAtY(y, geom);
      const a2 = this.strandAlphaAtY(y2, geom);

      g.lineStyle(this.strandWidth + 6, 0x000000, a1);
      g.beginPath();
      g.moveTo(this.xAAtY(y, geom), y);
      g.lineTo(this.xAAtY(y2, geom), y2);
      g.strokePath();

      g.lineStyle(this.strandWidth + 6, 0x000000, a2);
      g.beginPath();
      g.moveTo(this.xBAtY(y, geom), y);
      g.lineTo(this.xBAtY(y2, geom), y2);
      g.strokePath();

      g.lineStyle(this.strandWidth, 0xffffff, a1);
      g.beginPath();
      g.moveTo(this.xAAtY(y, geom), y);
      g.lineTo(this.xAAtY(y2, geom), y2);
      g.strokePath();

      g.lineStyle(this.strandWidth, 0xffffff, a2);
      g.beginPath();
      g.moveTo(this.xBAtY(y, geom), y);
      g.lineTo(this.xBAtY(y2, geom), y2);
      g.strokePath();
    }
  }

  private drawHelix() {
    const g = this.g;
    g.clear();

    const geom = this.getGeom();

    this.drawDebugOverlay();
    this.drawRibbon(g, geom);
    this.drawRungs(g, geom);
    this.drawStrands(g, geom);
  }

  public sampleGradientAtY(y: number) {
    const topY = this.getTopY();
    const botY = this.getBotY();
    const t = Phaser.Math.Clamp((y - topY) / (botY - topY), 0, 1);
    const hue01 = Phaser.Math.Linear(0, 0.75, t);
    const c = Phaser.Display.Color.HSVToRGB(hue01, 1, 1) as Phaser.Types.Display.ColorObject;
    return { r: c.r, g: c.g, b: c.b };
  }

  public getTopY() {
    return -this.dnaHeight / 2;
  }

  public getBotY() {
    return this.dnaHeight / 2;
  }

  public setProgress(progress: SoupProgress) {
    this.progress = progress;
  }

  private clamp01(v: number) {
    return Math.max(0, Math.min(1, v));
  }

  private smoothstep(edge0: number, edge1: number, x: number) {
    const t = this.clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  }

  private hueName(h01: number) {
    const d = (h: number) => {
      const x = Math.abs(h01 - h);
      return Math.min(x, 1 - x);
    };
    const samples = [
      { n: "red", h: 0.0 },
      { n: "yellow", h: 1 / 6 },
      { n: "green", h: 2 / 6 },
      { n: "cyan", h: 3 / 6 },
      { n: "blue", h: 4 / 6 },
      { n: "magenta", h: 5 / 6 }
    ];
    samples.sort((a, b) => d(a.h) - d(b.h));
    return samples[0].n;
  }
}
