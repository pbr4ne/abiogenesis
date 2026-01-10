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

  diffuseLayers?: number;
  diffuseJitterPx?: number;
  motionPx?: number;
  motionSpeed?: number;
  additive?: boolean;

  growDurationS?: number;
  minStrengthToShow?: number;
  color?: number;
};

export default class MagnetosphereRenderer {
  private g: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;

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
  private strength01 = 0;

  private loopCenterOffsetMulMin?: number;
  private loopCenterOffsetMulMax?: number;

  private innerRadiusMulMin?: number;
  private innerRadiusMulMax?: number;

  private outerRadiusMulMin?: number;
  private outerRadiusMulMax?: number;

  private t = 0;
  private destroyed = false;

  private diffuseLayers: number;
  private diffuseJitterPx: number;
  private motionPx: number;
  private motionSpeed: number;
  private additive: boolean;

  private ageS = 0;
  private growDurationS: number;

  private minStrengthToShow: number;
  private color: number;

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, cfg: MagnetosphereRendererConfig) {
    this.scene = scene;

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

    this.diffuseLayers = cfg.diffuseLayers ?? 4;
    this.diffuseJitterPx = cfg.diffuseJitterPx ?? 2.5;
    this.motionPx = cfg.motionPx ?? 8;
    this.motionSpeed = cfg.motionSpeed ?? 0.9;
    this.additive = cfg.additive ?? true;

    this.growDurationS = cfg.growDurationS ?? 1.8;

    this.minStrengthToShow = cfg.minStrengthToShow ?? 0.0025;
    this.color = cfg.color ?? 0x5fe7ff;

    this.g = scene.add.graphics();
    if (this.additive) this.g.setBlendMode(Phaser.BlendModes.ADD);
    parent.add(this.g);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy, this);

    this.g.clear();
  }

  public destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.destroy, this);

    if (this.g) {
      this.g.clear();
      this.g.destroy();
      this.g = null as any;
    }
  }

  public setStrength01(v: number) {
    this.strength01 = Phaser.Math.Clamp(v, 0, 1);
  }

  private onUpdate(_: number, dt: number) {
    if (this.destroyed) return;
    if (!this.g) return;

    const raw = this.strengthOverride01 ?? this.strength01;
    const strength = Phaser.Math.Clamp(raw, 0, 1);

    if (strength < this.minStrengthToShow) {
      this.ageS = 0;
      this.g.clear();
      return;
    }

    this.ageS += dt / 1000;
    this.t += (dt / 1000) * Phaser.Math.Linear(0.6, 2.2, strength) * this.motionSpeed;

    this.draw(this.t, strength);
  }

  private pickMul(min: number | undefined, max: number | undefined, fallback: number, s: number) {
    if (min === undefined || max === undefined) return fallback;
    return Phaser.Math.Linear(min, max, s);
  }

  private draw(timeS: number, strength: number) {
    if (!this.g) return;

    this.g.clear();
    if (strength < this.minStrengthToShow) return;

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

    const baseOx = this.r * loopMul;
    const baseInnerR = this.r * innerMul;
    const baseOuterR = this.r * outerMul;

    const reveal01 = Phaser.Math.Clamp(this.ageS / this.growDurationS, 0, 1);
    const reveal = Phaser.Math.Easing.Cubic.Out(reveal01);
    const revealTight = Math.pow(reveal, 3.2);

    const count = Math.max(1, Math.round(this.perSideLines * Phaser.Math.Linear(0.65, 1.0, sShape)));
    const visibleN = Math.max(1, Math.round(count * Phaser.Math.Linear(0.20, 1.0, reveal)));

    const layers = Math.max(2, Math.round(Phaser.Math.Linear(4, this.diffuseLayers + 3, sShape)));
    const jitter = Phaser.Math.Linear(1.2, this.diffuseJitterPx * 1.6, sShape);
    const motion = Phaser.Math.Linear(0.8, this.motionPx, sShape);

    const baseA =
      this.lineAlpha *
      Phaser.Math.Linear(0.18, 0.55, sShape) *
      Phaser.Math.Linear(0.85, 1.25, sShape);

    const baseW = Phaser.Math.Linear(this.lineWidth * 1.1, this.lineWidth * 1.8, sShape);

    const driftX = Math.sin(timeS * 0.7) * motion * 0.35;
    const driftY = Math.cos(timeS * 0.9) * motion * 0.25;

    for (let layer = 0; layer < layers; layer++) {
      const lt = layers <= 1 ? 0 : layer / (layers - 1);
      const lShape = 1 - Math.pow(lt, 1.4);

      const jx = (Math.sin(timeS * (1.2 + lt * 0.8) + layer * 3.1) * jitter + driftX) * lShape;
      const jy = (Math.cos(timeS * (1.0 + lt * 0.9) + layer * 2.4) * jitter + driftY) * lShape;

      const wobble =
        Math.sin(timeS * (1.6 + lt * 1.1) + layer * 1.9) *
        Phaser.Math.Linear(0, motion * 0.35, sShape);

      const ox = baseOx + wobble;
      const innerR = baseInnerR + wobble * 0.25;
      const outerR = baseOuterR + wobble * 0.45;

      const a = baseA * Phaser.Math.Linear(0.08, 0.28, lShape);
      const w = baseW * Phaser.Math.Linear(0.85, 1.25, lShape);

      this.g.lineStyle(w, this.color, a);

      const spread = Phaser.Math.Linear(0.0, 0.6, sShape);

      const innerNow = Phaser.Math.Linear(innerR * 0.55, innerR, reveal);
      const outerNow = Phaser.Math.Linear(innerR * 1.03, outerR, revealTight);

      for (let i = 0; i < visibleN; i++) {
        const t = visibleN <= 1 ? 0 : i / (visibleN - 1);
        const tt = Math.pow(t, 1.7);

        const rrBase = Phaser.Math.Linear(innerNow, outerNow, tt);
        const rrWob =
          Math.sin(timeS * (2.2 + t * 1.6) + layer * 0.9 + t * 6.0) *
          Phaser.Math.Linear(0, motion * 0.6, sShape);

        const rr = rrBase + rrWob;

        const cxL = this.cx - ox + jx - (t - 0.5) * motion * spread;
        const cxR = this.cx + ox + jx + (t - 0.5) * motion * spread;

        const cy =
          this.cy +
          jy +
          Math.sin(timeS * 1.1 + t * 4.0 + layer) *
          Phaser.Math.Linear(0, motion * 0.15, sShape);

        this.g.strokeCircle(cxL, cy, rr);
        this.g.strokeCircle(cxR, cy, rr);
      }
    }
  }
}
