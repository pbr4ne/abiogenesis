import Phaser from "phaser";
import { makeRotator } from "../planet/sphereMath";
import { generateColours, createRevealGrid } from "../planet/colourGrid";
import { drawBaseGradient, drawTiles, drawWireGrid } from "../planet/planetRender";

export default class Planet extends Phaser.GameObjects.Container {
  private divisions: number;
  private diameter: number;
  private r: number;

  private rotate: ReturnType<typeof makeRotator>;

  private base!: Phaser.GameObjects.Graphics;
  private tiles!: Phaser.GameObjects.Graphics;
  private grid!: Phaser.GameObjects.Graphics;

  private colours: string[][];
  private revealed: boolean[][];

  private lastRevealAt: number;

  private onUpdate = () => {
    const now = this.scene.time.now;
    if (now - this.lastRevealAt < 1000) {
      return;
    }
    this.lastRevealAt = now;

    this.revealRandomVisibleCell();
    drawTiles(this.tiles, this.r, this.divisions, 2, this.rotate, this.colours, this.revealed);
  };

  constructor(scene: Phaser.Scene, x = 960, y = 540, colours?: string[][]) {
    super(scene, x, y);

    this.divisions = 40;
    this.diameter = 768;
    this.r = this.diameter / 2;

    const tilt = Phaser.Math.DegToRad(-28);
    const yaw = Phaser.Math.DegToRad(20);
    this.rotate = makeRotator(tilt, yaw);

    this.colours = generateColours(colours, this.divisions);
    this.revealed = createRevealGrid(this.divisions);

    this.lastRevealAt = this.scene.time.now;

    this.base = scene.add.graphics();
    this.tiles = scene.add.graphics();
    this.grid = scene.add.graphics();

    this.add(this.base);
    this.add(this.tiles);
    this.add(this.grid);

    drawBaseGradient(this.base, this.r);
    drawTiles(this.tiles, this.r, this.divisions, 2, this.rotate, this.colours, this.revealed);
    drawWireGrid(this.grid, this.r, this.divisions, 160, 3, 0.35, this.rotate);

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate);
    });
  }

  private revealRandomVisibleCell(): void {
    const maxTries = 4000;

    for (let i = 0; i < maxTries; i++) {
      const latI = Phaser.Math.Between(0, this.divisions - 1);
      const lonI = Phaser.Math.Between(0, this.divisions - 1);

      if (this.revealed[latI][lonI]) {
        continue;
      }

      const latMid = Phaser.Math.Linear(-Math.PI / 2, Math.PI / 2, (latI + 0.5) / this.divisions);
      const lonMid = Phaser.Math.Linear(-Math.PI, Math.PI, (lonI + 0.5) / this.divisions);

      const px = this.r * Math.cos(latMid) * Math.sin(lonMid);
      const py = this.r * Math.sin(latMid);
      const pz = this.r * Math.cos(latMid) * Math.cos(lonMid);

      const p = this.rotate(px, py, pz);
      if (p.z < 0) {
        continue;
      }

      this.revealed[latI][lonI] = true;
      return;
    }
  }
}
