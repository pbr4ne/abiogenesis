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

  loopCenterOffsetMulMin?: number;
  loopCenterOffsetMulMax?: number;

  innerRadiusMulMin?: number;
  innerRadiusMulMax?: number;

  outerRadiusMulMin?: number;
  outerRadiusMulMax?: number;
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

  private strengthOverride01: number | null | undefined;

  private loopCenterOffsetMulMin?: number;
  private loopCenterOffsetMulMax?: number;

  private innerRadiusMulMin?: number;
  private innerRadiusMulMax?: number;

  private outerRadiusMulMin?: number;
  private outerRadiusMulMax?: number;

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

    this.strengthOverride01 = cfg.strengthOverride01;

    this.loopCenterOffsetMulMin = cfg.loopCenterOffsetMulMin;
    this.loopCenterOffsetMulMax = cfg.loopCenterOffsetMulMax;

    this.innerRadiusMulMin = cfg.innerRadiusMulMin;
    this.innerRadiusMulMax = cfg.innerRadiusMulMax;

    this.outerRadiusMulMin = cfg.outerRadiusMulMin;
    this.outerRadiusMulMax = cfg.outerRadiusMulMax;

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

  private pickMul(min: number | undefined, max: number | undefined, fallback: number, s: number) {
    if (min === undefined || max === undefined) return fallback;
    return Phaser.Math.Linear(min, max, s);
  }

  private draw() {
    const raw = this.strengthOverride01 ?? this.strength01;
    const strength = Phaser.Math.Clamp(raw, 0, 1);

    this.g.clear();
    if (strength <= 0.001) return;

    const count = this.perSideLines;

    const sShape = Phaser.Math.Easing.Cubic.Out(strength);

    const loopMul = this.pickMul(
      this.loopCenterOffsetMulMin,
      this.loopCenterOffsetMulMax,
      this.loopCenterOffsetMul,
      sShape
    );

    const innerMul = this.pickMul(
      this.innerRadiusMulMin,
      this.innerRadiusMulMax,
      this.innerRadiusMul,
      sShape
    );

    const outerMul = this.pickMul(
      this.outerRadiusMulMin,
      this.outerRadiusMulMax,
      this.outerRadiusMul,
      sShape
    );

    const ox = this.r * loopMul;
    const innerR = this.r * innerMul;
    const outerR = this.r * outerMul;

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
