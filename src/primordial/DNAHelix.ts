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

  private drawHelix() {
    const g = this.g;
    g.clear();

    const topY = -this.dnaHeight / 2;
    const botY = this.dnaHeight / 2;

    const freq = (this.turns * Math.PI * 2) / this.dnaHeight;

    const xA = (y: number) => {
      const s = Math.sin((y - topY) * freq + this.phase);
      return -this.centerGap / 2 + s * this.amp;
    };

    const xB = (y: number) => {
      const s = Math.sin((y - topY) * freq + this.phase + Math.PI);
      return this.centerGap / 2 + s * this.amp;
    };

    const colorAtY = (y: number) => {
      const t = Phaser.Math.Clamp((y - topY) / (botY - topY), 0, 1);
      const hue01 = Phaser.Math.Linear(0, 0.75, t);
      return Phaser.Display.Color.HSVToRGB(hue01, 1, 1) as Phaser.Types.Display.ColorObject;
    };


    const alphaStrandAtY = (y: number) => {
      const z = Math.cos((y - topY) * freq + this.phase);
      return Phaser.Math.Clamp(0.25 + 0.75 * ((z + 1) / 2), 0.25, 1);
    };

    const drawRung = (y: number, alpha: number) => {
      const ax = xA(y);
      const bx = xB(y);

      g.lineStyle(9, 0x000000, alpha);
      g.beginPath();
      g.moveTo(ax, y);
      g.lineTo(bx, y);
      g.strokePath();

      g.lineStyle(3, 0xffffff, alpha);
      g.beginPath();
      g.moveTo(ax, y);
      g.lineTo(bx, y);
      g.strokePath();
    };

    for (let y = topY; y < botY; y += this.stepsPx) {
      const y2 = Math.min(y + this.stepsPx, botY);

      const ax1 = xA(y);
      const bx1 = xB(y);
      const ax2 = xA(y2);
      const bx2 = xB(y2);

      const mid1 = (ax1 + bx1) / 2;
      const mid2 = (ax2 + bx2) / 2;

      const w1 = Math.abs(bx1 - ax1);
      const w2 = Math.abs(bx2 - ax2);

      const minW = Math.min(w1, w2);

      const minInner = this.strandWidth + 3;
      const innerW = Phaser.Math.Clamp(minW, minInner, minW - minInner);

      if (innerW <= 0) continue;

      const left1 = mid1 - innerW / 2;
      const right1 = mid1 + innerW / 2;
      const left2 = mid2 - innerW / 2;
      const right2 = mid2 + innerW / 2;

      const c = colorAtY((y + y2) / 2);
      const packed = Phaser.Display.Color.GetColor(c.r, c.g, c.b);

      const hue01 = Phaser.Math.Linear(0, 0.75, Phaser.Math.Clamp((((y + y2) / 2) - topY) / (botY - topY), 0, 1));
      const a = this.progress ? this.progress.helixAlphaForHue01(hue01) : 0;

      if (a <= 0.001) continue;

      g.fillStyle(packed, 0.05 + 0.85 * a);
      g.beginPath();
      g.moveTo(left1, y);
      g.lineTo(right1, y);
      g.lineTo(right2, y2);
      g.lineTo(left2, y2);
      g.closePath();
      g.fillPath();
    }

    const rungCount = 30;

    for (let i = 0; i < rungCount; i++) {
      const t = i / (rungCount - 1);
      const y = Phaser.Math.Linear(topY, botY, t);

      const widthHere = Math.abs(xB(y) - xA(y));
      const minW = this.centerGap;
      const maxW = this.centerGap + this.amp * 2;

      const w01 = Phaser.Math.Clamp((widthHere - minW) / (maxW - minW), 0, 1);
      const a = 0.25 + 0.55 * Math.pow(w01, 0.8);

      drawRung(y, a);
    }

    for (let y = topY; y < botY; y += this.stepsPx) {
      const y2 = Math.min(y + this.stepsPx, botY);

      const a1 = alphaStrandAtY(y);
      const a2 = alphaStrandAtY(y2);

      g.lineStyle(this.strandWidth + 6, 0x000000, a1);
      g.beginPath();
      g.moveTo(xA(y), y);
      g.lineTo(xA(y2), y2);
      g.strokePath();

      g.lineStyle(this.strandWidth + 6, 0x000000, a2);
      g.beginPath();
      g.moveTo(xB(y), y);
      g.lineTo(xB(y2), y2);
      g.strokePath();

      g.lineStyle(this.strandWidth, 0xffffff, a1);
      g.beginPath();
      g.moveTo(xA(y), y);
      g.lineTo(xA(y2), y2);
      g.strokePath();

      g.lineStyle(this.strandWidth, 0xffffff, a2);
      g.beginPath();
      g.moveTo(xB(y), y);
      g.lineTo(xB(y2), y2);
      g.strokePath();
    }
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
}
