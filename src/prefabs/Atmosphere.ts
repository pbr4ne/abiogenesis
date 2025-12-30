import Phaser from "phaser";
import PlanetEdge from "./PlanetEdge";

type AtmosphereConfig = {
  diameter: number;
  offsetRatio: number;

  textureKey: string;

  count: number;
  arcStartDeg: number;
  arcEndDeg: number;

  radiusOffset: number;
};

export default class Atmosphere extends Phaser.GameObjects.Container {
  private diameter: number;
  private r: number;
  private offsetRatio: number;

  private textureKey: string;

  private atmoCount: number;
  private arcStartDeg: number;
  private arcEndDeg: number;

  private radiusOffset: number;

  private planetEdge!: PlanetEdge;
  private sprites: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: AtmosphereConfig) {
    super(scene, x, y);

    this.diameter = cfg.diameter;
    this.r = this.diameter / 2;
    this.offsetRatio = Phaser.Math.Clamp(cfg.offsetRatio, 0.25, 0.95);

    this.textureKey = cfg.textureKey;

    this.atmoCount = cfg.count;
    this.arcStartDeg = cfg.arcStartDeg;
    this.arcEndDeg = cfg.arcEndDeg;

    this.radiusOffset = cfg.radiusOffset;

    this.planetEdge = new PlanetEdge(scene, 0, 0, { diameter: this.diameter, capRatio: this.offsetRatio });
    this.add(this.planetEdge);

    this.rebuildSprites();
  }

  public rebuildSprites() {
    for (const s of this.sprites) {
      s.destroy();
    }
    this.sprites = [];

    const localCenterX = 0;
    const localCenterY = this.r * this.offsetRatio;

    const arcStart = Phaser.Math.DegToRad(this.arcStartDeg);
    const arcEnd = Phaser.Math.DegToRad(this.arcEndDeg);

    const radius = this.r + this.radiusOffset;

    for (let i = 0; i < this.atmoCount; i++) {
      const t = this.atmoCount === 1 ? 0.5 : i / (this.atmoCount - 1);
      const ang = Phaser.Math.Linear(arcStart, arcEnd, t);

      const x = localCenterX + Math.cos(ang) * radius;
      const y = localCenterY + Math.sin(ang) * radius;

      const img = this.scene.add.image(x, y, this.textureKey);

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
