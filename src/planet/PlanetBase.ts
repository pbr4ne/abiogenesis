import Phaser from "phaser";
import { makeRotator, pickCellByNearestProjectedCenter } from "./PlanetMath";
import { drawBaseGradient, drawTiles, drawWireGrid } from "./PlanetRenderer";
import PlanetGrid from "./PlanetGrid";

export type PlanetBaseConfig = {
  divisions?: number;
  diameter?: number;
  tiltDeg?: number;
  yawDeg?: number;
  wireEvery?: number;
  wireWidth?: number;
  wireAlpha?: number;
};

export default class PlanetBase extends Phaser.GameObjects.Container {
  protected divisions: number;
  protected diameter: number;
  protected r: number;

  protected rotate: ReturnType<typeof makeRotator>;
  protected hitZone!: Phaser.GameObjects.Zone;

  protected base!: Phaser.GameObjects.Graphics;
  protected tiles!: Phaser.GameObjects.Graphics;
  protected grid!: Phaser.GameObjects.Graphics;

  protected gridData: PlanetGrid;

  protected lastRevealAt: number;

  private onUpdate = () => {
    const now = this.scene.time.now;
    if (now - this.lastRevealAt < 1000) return;
    this.lastRevealAt = now;

    drawTiles(this.tiles, this.r, this.divisions, 2, this.rotate, this.gridData.getCellsRef());
  };

  constructor(scene: Phaser.Scene, x = 960, y = 540, cfg: PlanetBaseConfig = {}) {
    super(scene, x, y);

    this.divisions = cfg.divisions ?? 40;
    this.diameter = cfg.diameter ?? 768;
    this.r = this.diameter / 2;

    const tilt = Phaser.Math.DegToRad(cfg.tiltDeg ?? -28);
    const yaw = Phaser.Math.DegToRad(cfg.yawDeg ?? 20);
    this.rotate = makeRotator(tilt, yaw);

    this.gridData = new PlanetGrid(this.divisions);

    this.lastRevealAt = this.scene.time.now;

    this.base = scene.add.graphics();
    this.tiles = scene.add.graphics();
    this.grid = scene.add.graphics();

    this.add(this.base);
    this.add(this.tiles);
    this.add(this.grid);

    drawBaseGradient(this.base, this.r, 0);
    drawTiles(this.tiles, this.r, this.divisions, 2, this.rotate, this.gridData.getCellsRef());

    drawWireGrid(
      this.grid,
      this.r,
      this.divisions,
      cfg.wireEvery ?? 160,
      cfg.wireWidth ?? 3,
      cfg.wireAlpha ?? 0.35,
      this.rotate
    );

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

  public onPlanetPointerMove(cb: (pointer: Phaser.Input.Pointer) => void) {
    this.hitZone.on("pointermove", cb);
  }

  public paintAtPoint(worldX: number, worldY: number, colourHex: string, alpha = 1): boolean {
    const dx = worldX - this.x;
    const dy = worldY - this.y;

    const cell = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);
    if (!cell) return false;

    this.gridData.setHex(cell.row, cell.col, colourHex, alpha);
    drawTiles(this.tiles, this.r, this.divisions, 2, this.rotate, this.gridData.getCellsRef());
    return true;
  }

  public getGridData() {
    return this.gridData;
  }

  public redrawTiles() {
    drawTiles(this.tiles, this.r, this.divisions, 2, this.rotate, this.gridData.getCellsRef());
  }
}
