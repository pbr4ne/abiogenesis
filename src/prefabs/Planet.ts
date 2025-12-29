import Phaser from "phaser";
import { makeRotator, pickCellByNearestProjectedCenter } from "../planet/PlanetMath";
import { drawBaseGradient, drawTiles, drawWireGrid } from "../planet/PlanetRenderer";
import PlanetGrid from "../planet/PlanetGrid";

export default class Planet extends Phaser.GameObjects.Container {
  private divisions: number;
  private diameter: number;
  private r: number;

  private rotate: ReturnType<typeof makeRotator>;
  private hitZone!: Phaser.GameObjects.Zone;

  private base!: Phaser.GameObjects.Graphics;
  private tiles!: Phaser.GameObjects.Graphics;
  private grid!: Phaser.GameObjects.Graphics;

  private gridData: PlanetGrid;

  private lastRevealAt: number;

  private onUpdate = () => {
    const now = this.scene.time.now;
    if (now - this.lastRevealAt < 1000) {
      return;
    }
    this.lastRevealAt = now;

    drawTiles(this.tiles, this.r, this.divisions, 2, this.rotate, this.gridData.getCellsRef());
  };

  constructor(scene: Phaser.Scene, x = 960, y = 540) {
    super(scene, x, y);

    this.divisions = 40;
    this.diameter = 768;
    this.r = this.diameter / 2;

    const tilt = Phaser.Math.DegToRad(-28);
    const yaw = Phaser.Math.DegToRad(20);
    this.rotate = makeRotator(tilt, yaw);

    this.gridData = new PlanetGrid(this.divisions);

    this.lastRevealAt = this.scene.time.now;

    this.base = scene.add.graphics();
    this.tiles = scene.add.graphics();
    this.grid = scene.add.graphics();

    this.add(this.base);
    this.add(this.tiles);
    this.add(this.grid);

    drawBaseGradient(this.base, this.r);
    drawTiles(this.tiles, this.r, this.divisions, 2, this.rotate, this.gridData.getCellsRef());
    drawWireGrid(this.grid, this.r, this.divisions, 160, 3, 0.35, this.rotate);

    this.hitZone = scene.add.zone(-this.r, -this.r, this.diameter, this.diameter);
    this.hitZone.setOrigin(0, 0);
    this.hitZone.setInteractive(new Phaser.Geom.Circle(this.r, this.r, this.r), Phaser.Geom.Circle.Contains);
    this.add(this.hitZone);

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate);
    });
  }

  public onPlanetPointerDown(cb: (pointer: Phaser.Input.Pointer) => void) {
    this.hitZone.on("pointerdown", cb);
  }

  public paintAtPoint(worldX: number, worldY: number, colourHex: string): boolean {
    const dx = worldX - this.x;
    const dy = worldY - this.y;

    const cell = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);

    if (!cell) {
      return false;
    }

    const { row, col } = cell;

    this.gridData.setHex(row, col, colourHex, 1);

    drawTiles(this.tiles, this.r, this.divisions, 2, this.rotate, this.gridData.getCellsRef());
    return true;
  }

  public getAverageColour() {
    return this.gridData.averageRGBWeightedByAlpha();
  }

  public getGridData() {
    return this.gridData;
  }
}
