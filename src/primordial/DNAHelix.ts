import Phaser from "phaser";

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

    const colorAtY = (y: number): number => {
      const t = Phaser.Math.Clamp((y - topY) / (botY - topY), 0, 1);

      const hue01 = Phaser.Math.Linear(0, 0.75, t);
      const c = Phaser.Display.Color.HSVToRGB(hue01, 1, 1) as Phaser.Types.Display.ColorObject;

      return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
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

      const col = colorAtY((y + y2) / 2);

      g.fillStyle(col, 1);
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
}
