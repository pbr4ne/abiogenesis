import Phaser from "phaser";
import { latForIndex, lonForIndex, Rotator, Vec3 } from "../../planet/PlanetMath";

export type CoreExplosionsCfg = {
  parent: Phaser.GameObjects.Container;

  getRotate: () => Rotator;
  getR: () => number;
  getDivisions: () => number;

  delayMs?: number;

  baseChance?: number;
  maxChance?: number;

  minBursts?: number;
  maxBursts?: number;

  minRadius?: number;
  maxRadius?: number;

  minLifeMs?: number;
  maxLifeMs?: number;
};

export default class CoreExplosions {
  private scene: Phaser.Scene;
  private cfg: CoreExplosionsCfg;

  private fx?: Phaser.GameObjects.Container;
  private timer?: Phaser.Time.TimerEvent;

  private strength01 = 0;

  constructor(scene: Phaser.Scene, cfg: CoreExplosionsCfg) {
    this.scene = scene;
    this.cfg = cfg;
  }

  public destroy() {
    this.timer?.remove(false);
    this.timer = undefined;

    this.fx?.destroy(true);
    this.fx = undefined;
  }

  public setStrength01(v: number) {
    const s = Phaser.Math.Clamp(v, 0, 1);
    this.strength01 = s;

    if (s <= 0.001) {
      this.timer?.remove(false);
      this.timer = undefined;
      this.fx?.removeAll(true);
      return;
    }

    if (!this.fx) {
      this.fx = this.scene.add.container(0, 0);
      this.cfg.parent.add(this.fx);
    }

    if (!this.timer) {
      this.timer = this.scene.time.addEvent({
        delay: this.cfg.delayMs ?? 250,
        loop: true,
        callback: () => this.tick()
      });
    }
  }

  private tick() {
    const s = this.strength01;
    if (!this.fx || s <= 0.001) return;

    const start = 0.02;
    const k = Phaser.Math.Clamp((s - start) / Math.max(0.0001, 1 - start), 0, 1);
    const shaped = Phaser.Math.Easing.Cubic.Out(k);

    const chance = Phaser.Math.Linear(this.cfg.baseChance ?? 0.08, this.cfg.maxChance ?? 0.85, shaped);
    if (Math.random() > chance) return;

    const bursts = Math.round(Phaser.Math.Linear(this.cfg.minBursts ?? 1, this.cfg.maxBursts ?? 4, shaped));
    for (let i = 0; i < bursts; i++) this.spawnExplosion(shaped);
  }

  private spawnExplosion(power01: number) {
    if (!this.fx) return;

    const p = this.pickRandomVisibleSurfacePoint();
    if (!p) return;

    const g = this.scene.add.graphics();
    g.setBlendMode(Phaser.BlendModes.ADD);

    const baseR = Phaser.Math.Linear(this.cfg.minRadius ?? 5, this.cfg.maxRadius ?? 16, power01);
    const a0 = Phaser.Math.Linear(0.10, 0.28, power01);

    const ox = Phaser.Math.FloatBetween(-1.5, 1.5);
    const oy = Phaser.Math.FloatBetween(-1.5, 1.5);

    const px = p.x;
    const py = p.y;

    const state = { t: 0 };

    const hot = 0xff2a1a;
    const warm = 0xff6a2a;
    const bright = 0xffcc33;

    const redraw = () => {
      g.clear();

      const t = Phaser.Math.Clamp(state.t, 0, 1);

      const bloom = Phaser.Math.Easing.Quadratic.Out(Math.min(1, t / 0.25));
      const fade = 1 - Phaser.Math.Easing.Cubic.In(t);

      const rOuter = baseR * (0.9 + 1.6 * bloom);
      const rMid = baseR * (0.55 + 1.1 * bloom);
      const rCore = baseR * (0.25 + 0.65 * bloom);

      const aOuter = a0 * 0.35 * fade;
      const aMid = a0 * 0.55 * fade;
      const aCore = a0 * 0.65 * fade;

      g.fillStyle(warm, aOuter);
      g.fillCircle(px, py, rOuter);

      g.fillStyle(hot, aMid);
      g.fillCircle(px + ox, py + oy, rMid);

      g.fillStyle(bright, aCore * 0.75);
      g.fillCircle(px + ox * 0.6, py + oy * 0.6, rCore);

      const sparkCount = Math.round(Phaser.Math.Linear(0, 3, power01));
      for (let i = 0; i < sparkCount; i++) {
        const ang = (i / Math.max(1, sparkCount)) * Math.PI * 2 + (ox + oy);
        const sr = rMid * Phaser.Math.FloatBetween(0.6, 1.0);
        const sx = px + Math.cos(ang) * sr;
        const sy = py + Math.sin(ang) * sr;
        g.fillStyle(bright, a0 * 0.18 * fade);
        g.fillCircle(sx, sy, Phaser.Math.FloatBetween(1.0, 2.2));
      }
    };

    redraw();
    this.fx.add(g);

    const life = Phaser.Math.Linear(this.cfg.minLifeMs ?? 240, this.cfg.maxLifeMs ?? 520, power01);

    this.scene.tweens.add({
      targets: state,
      t: 1,
      duration: life,
      ease: "Linear",
      onUpdate: redraw,
      onComplete: () => g.destroy()
    });
  }

  private pickRandomVisibleSurfacePoint() {
    const div = this.cfg.getDivisions();
    const r = this.cfg.getR();
    const rot = this.cfg.getRotate();

    for (let tries = 0; tries < 30; tries++) {
      const row = Phaser.Math.Between(0, div - 1);
      const col = Phaser.Math.Between(0, div - 1);

      const lat0 = latForIndex(row, div);
      const lat1 = latForIndex(row + 1, div);
      const lon0 = lonForIndex(col, div);
      const lon1 = lonForIndex(col + 1, div);

      const lat = (lat0 + lat1) * 0.5;
      const lon = (lon0 + lon1) * 0.5;

      const u: Vec3 = {
        x: Math.cos(lat) * Math.sin(lon),
        y: Math.sin(lat),
        z: Math.cos(lat) * Math.cos(lon)
      };

      const ru = rot(u.x, u.y, u.z);
      if (ru.z <= 0) continue;

      return { x: ru.x * r, y: ru.y * r };
    }

    return null;
  }
}
