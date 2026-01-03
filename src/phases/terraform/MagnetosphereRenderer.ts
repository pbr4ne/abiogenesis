import Phaser from "phaser";

export type MagnetosphereRendererConfig = {
  r: number;
  centerX?: number;
  centerY?: number;

  lineAlpha: number;
  lineWidth: number;

  perSideLines: number;

  loopCenterOffsetMul: number;
  innerRadiusMul: number;
  outerRadiusMul: number;

  strengthOverride01?: number | null;
};

export default class MagnetosphereRenderer {
  private g: Phaser.GameObjects.Graphics;

  private r: number;
  private cx: number;
  private cy: number;

  private lineAlpha: number;
  private lineWidth: number;

  private perSideLines: number;

  private loopCenterOffsetMul: number;
  private innerRadiusMul: number;
  private outerRadiusMul: number;

  private strength01 = 0;

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, cfg: MagnetosphereRendererConfig) {
    this.r = cfg.r;
    this.cx = cfg.centerX ?? 0;
    this.cy = cfg.centerY ?? 0;

    this.lineAlpha = cfg.lineAlpha;
    this.lineWidth = cfg.lineWidth;

    this.perSideLines = cfg.perSideLines;

    this.loopCenterOffsetMul = cfg.loopCenterOffsetMul;
    this.innerRadiusMul = cfg.innerRadiusMul;
    this.outerRadiusMul = cfg.outerRadiusMul;

    this.g = scene.add.graphics();
    parent.add(this.g);

    this.draw();
  }

  public destroy() {
    this.g.destroy();
  }

  public setStrength01(v: number) {
    this.strength01 = Phaser.Math.Clamp(v, 0, 1);
    this.draw();
  }

  private draw() {
    const strength = this.strength01;

    this.g.clear();
    if (strength <= 0.001) return;

    const ox = this.r * this.loopCenterOffsetMul;
    const innerR = this.r * this.innerRadiusMul;
    const outerR = this.r * this.outerRadiusMul;

    const count = this.perSideLines;

    this.g.lineStyle(this.lineWidth, 0x66ccff, this.lineAlpha * strength);

    for (let i = 0; i < count; i++) {
      const t = count <= 1 ? 0 : i / (count - 1);
            const tt = Math.pow(t, 1.7);
            const rr = Phaser.Math.Linear(innerR, outerR, tt);

      this.g.strokeCircle(this.cx - ox, this.cy, rr);
      this.g.strokeCircle(this.cx + ox, this.cy, rr);
    }
  }
}
