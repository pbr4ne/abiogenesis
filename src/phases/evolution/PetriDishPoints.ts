import Phaser from "phaser";

type PetriDishPointsCfg = {
  x: number;
  y: number;
  r: number;
  getPoints: () => number;
};

export default class PetriDishPoints extends Phaser.GameObjects.Container {
  private dishG: Phaser.GameObjects.Graphics;
  private nuggetsG: Phaser.GameObjects.Graphics;

  private r: number;
  private getPoints: () => number;

  private rng: Phaser.Math.RandomDataGenerator;

  private nugR = 4.5;
  private minDist = this.nugR * 2.2;
  private maxShown = 220;

  private positions: { x: number; y: number }[] = [];
  private lastPts = 0;

  constructor(scene: Phaser.Scene, cfg: PetriDishPointsCfg) {
    super(scene, cfg.x, cfg.y);

    this.r = cfg.r;
    this.getPoints = cfg.getPoints;

    this.rng = new Phaser.Math.RandomDataGenerator([String(scene.registry.get("run")?.seed ?? "seed"), "petri"]);

    this.dishG = scene.add.graphics();
    this.nuggetsG = scene.add.graphics();

    this.add([this.dishG, this.nuggetsG]);

    this.setScrollFactor(0);
    this.setDepth(5000);

    scene.add.existing(this);

    this.redrawDish();
    this.refresh(true);
  }

  private redrawDish() {
    const r = this.r;

    this.dishG.clear();

    this.dishG.fillStyle(0x0b0b0b, 0.45);
    this.dishG.fillCircle(0, 0, r);

    this.dishG.lineStyle(4, 0xffffff, 0.22);
    this.dishG.strokeCircle(0, 0, r);

    this.dishG.lineStyle(2, 0xffffff, 0.12);
    this.dishG.strokeCircle(0, 0, r - 10);
  }

  private tryPlaceOne() {
    const r = this.r - 16;
    const rad = this.nugR;

    for (let tries = 0; tries < 120; tries++) {
      const a = this.rng.frac() * Math.PI * 2;
      const rr = Math.sqrt(this.rng.frac()) * (r - rad - 2);

      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;

      let ok = true;
      for (const p of this.positions) {
        const dx = x - p.x;
        const dy = y - p.y;
        if (dx * dx + dy * dy < this.minDist * this.minDist) {
          ok = false;
          break;
        }
      }

      if (!ok) continue;

      this.positions.push({ x, y });
      return true;
    }

    return false;
  }

  private redrawNuggets() {
    this.nuggetsG.clear();

    this.nuggetsG.fillStyle(0xffffff, 0.95);
    this.nuggetsG.lineStyle(2, 0xffffff, 0.25);

    const shown = Math.min(this.positions.length, this.maxShown);

    for (let i = 0; i < shown; i++) {
      const p = this.positions[i];
      this.nuggetsG.fillCircle(p.x, p.y, this.nugR);
      this.nuggetsG.strokeCircle(p.x, p.y, this.nugR);
    }
  }

  public refresh(force = false) {
    const pts = Math.max(0, Math.floor(this.getPoints()));
    const capped = Math.min(pts, this.maxShown);

    if (!force && pts === this.lastPts) return;
    this.lastPts = pts;

    if (this.positions.length > capped) {
      this.positions.length = capped;
      this.redrawNuggets();
      return;
    }

    if (this.positions.length < capped) {
      let addedAny = false;
      while (this.positions.length < capped) {
        const ok = this.tryPlaceOne();
        if (!ok) break;
        addedAny = true;
      }
      if (addedAny || force) this.redrawNuggets();
      return;
    }

    if (force) this.redrawNuggets();
  }
}
