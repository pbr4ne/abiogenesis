import Phaser from "phaser";
import { drawBaseGradient } from "../planet/PlanetRenderer";
import { drawAtmosphereGlow } from "../planet/AtmosphereRenderer";

type PlanetEdgeConfig = {
  diameter?: number;
  capRatio?: number;
};

export default class PlanetEdge extends Phaser.GameObjects.Container {
  private diameter: number;
  private r: number;
  private capRatio: number;

  private base!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x = 960, y = 0, cfg: PlanetEdgeConfig = {}) {
    super(scene, x, y);

    this.diameter = cfg.diameter ?? 1100;
    this.r = this.diameter / 2;

    this.capRatio = Phaser.Math.Clamp(cfg.capRatio ?? 0.60, 0.25, 0.95);

    this.base = scene.add.graphics();
    this.glow = scene.add.graphics();

    this.add(this.base);
    this.add(this.glow);

    const centerY = this.r * this.capRatio;

    drawBaseGradient(this.base, this.r, centerY);
    drawAtmosphereGlow(this.glow, this.r, centerY);

    scene.add.existing(this);
  }
}
