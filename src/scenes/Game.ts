import Phaser from "phaser";
import BaseScene from "./BaseScene";
import Planet from "../prefabs/Planet";
import { log } from "../utilities/GameUtils";

export default class Game extends BaseScene {

  constructor() {
    super("Game");
  }

  public planet!: Planet;

  editorCreate(): void {
    super.create();
    
    this.events.emit("scene-awake");
  }

  private createStarLayer(count: number, minR: number, maxR: number, alpha: number, depth: number) {
    const g = this.add.graphics();
    g.setDepth(depth);

    const { width, height } = this.scale;

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const r = Phaser.Math.FloatBetween(minR, maxR);

      g.fillStyle(0xffffff, alpha);
      g.fillCircle(x, y, r);
    }
  }

  create() {
    this.editorCreate();

    this.createStarLayer(200, 0.5, 1.2, 0.3, -1002);
    this.createStarLayer(120, 1, 2, 0.6, -1001);
    this.createStarLayer(40, 2, 3, 0.9, -1000);

    this.planet = new Planet(this);
    this.add.existing(this.planet);

    log("Game create");
  }
}
