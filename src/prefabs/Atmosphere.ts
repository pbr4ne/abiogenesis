import Phaser from "phaser";
import PlanetEdge from "./PlanetEdge";

type AtmosphereConfig = {
  diameter?: number;
  capRatio?: number;

  textureKey?: string;

  count?: number;
  arcStartDeg?: number;
  arcEndDeg?: number;

  radiusOffset?: number;
  spriteScale?: number;
  spriteAlpha?: number;

  depth?: number;
};

export default class Atmosphere extends Phaser.GameObjects.Container {
  private diameter: number;
  private r: number;
  private capRatio: number;

  private textureKey: string;

  private atmoCount: number;
  private arcStartDeg: number;
  private arcEndDeg: number;

  private radiusOffset: number;
  private spriteScale: number;
  private spriteAlpha: number;

  private planetEdge!: PlanetEdge;
  private sprites: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, x = 960, y = 0, cfg: AtmosphereConfig = {}) {
    super(scene, x, y);

    this.diameter = cfg.diameter ?? 2200;
    this.r = this.diameter / 2;
    this.capRatio = Phaser.Math.Clamp(cfg.capRatio ?? 0.62, 0.25, 0.95);

    this.textureKey = cfg.textureKey ?? "atmosphere";

    this.atmoCount = cfg.count ?? 28;
    this.arcStartDeg = cfg.arcStartDeg ?? 205;
    this.arcEndDeg = cfg.arcEndDeg ?? 335;

    this.radiusOffset = cfg.radiusOffset ?? 54;
    this.spriteScale = cfg.spriteScale ?? 1.0;
    this.spriteAlpha = cfg.spriteAlpha ?? 0.9;

    if (cfg.depth !== undefined) {
      this.setDepth(cfg.depth);
    }

    this.planetEdge = new PlanetEdge(scene, 0, 0, { diameter: this.diameter, capRatio: this.capRatio });
    this.add(this.planetEdge);

    this.rebuildSprites();
  }

  public rebuildSprites() {
    for (const s of this.sprites) {
      s.destroy();
    }
    this.sprites = [];

    const localCenterX = 0;
    const localCenterY = this.r * this.capRatio;

    const arcStart = Phaser.Math.DegToRad(this.arcStartDeg);
    const arcEnd = Phaser.Math.DegToRad(this.arcEndDeg);

    const radius = this.r + this.radiusOffset;

    for (let i = 0; i < this.atmoCount; i++) {
      const t = this.atmoCount === 1 ? 0.5 : i / (this.atmoCount - 1);
      const ang = Phaser.Math.Linear(arcStart, arcEnd, t);

      const x = localCenterX + Math.cos(ang) * radius;
      const y = localCenterY + Math.sin(ang) * radius;

      const img = this.scene.add.image(x, y, this.textureKey);
      img.setAlpha(this.spriteAlpha);
      img.setScale(this.spriteScale);

      img.setRotation(ang + Math.PI / 2);

      this.add(img);
      this.sprites.push(img);
    }
  }

  public setArc(arcStartDeg: number, arcEndDeg: number) {
    this.arcStartDeg = arcStartDeg;
    this.arcEndDeg = arcEndDeg;
    this.rebuildSprites();
  }

  public setCount(count: number) {
    this.atmoCount = Math.max(1, Math.floor(count));
    this.rebuildSprites();
  }
}
