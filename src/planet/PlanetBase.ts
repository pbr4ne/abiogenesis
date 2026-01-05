import Phaser from "phaser";
import { makeRotator, pickCellByNearestProjectedCenter } from "./PlanetMath";
import { drawBaseGradient, drawTiles, drawWireGrid } from "./PlanetRenderer";
import PlanetGrid from "./PlanetGrid";
import { log } from "../utilities/GameUtils";

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

  protected behind!: Phaser.GameObjects.Container;
  protected base!: Phaser.GameObjects.Graphics;
  protected tiles!: Phaser.GameObjects.Graphics;
  protected grid!: Phaser.GameObjects.Graphics;

  protected gridData: PlanetGrid;

  protected lastRevealAt: number;
  protected lifeBumps!: Phaser.GameObjects.Graphics;

  private yawRad = 0;
  private tiltRad = 0;
  private yawStepRad = 0;

  private rotationEvent?: Phaser.Time.TimerEvent;

  private wireEvery: number;
  private wireWidth: number;
  private wireAlpha: number;

  private updateRotator() {
    this.rotate = makeRotator(this.tiltRad, this.yawRad);
  }

  private onUpdate = () => {
    const now = this.scene.time.now;
    if (now - this.lastRevealAt < 1000) return;
    this.lastRevealAt = now;

    drawTiles(this.tiles, this.r, this.divisions, 2, this.rotate, this.gridData.getCellsRef());
    this.onAfterTilesRedraw();
  };
  constructor(scene: Phaser.Scene, x = 960, y = 540, cfg: PlanetBaseConfig = {}) {
    super(scene, x, y);

    this.divisions = cfg.divisions ?? 40;
    this.diameter = cfg.diameter ?? 768;
    this.r = this.diameter / 2;

    this.wireEvery = cfg.wireEvery ?? 160;
    this.wireWidth = cfg.wireWidth ?? 3;
    this.wireAlpha = cfg.wireAlpha ?? 0.35;

    const tilt = Phaser.Math.DegToRad(cfg.tiltDeg ?? -28);
    const yaw = Phaser.Math.DegToRad(cfg.yawDeg ?? 20);

    this.tiltRad = tilt;
    this.yawRad = yaw;
    this.yawStepRad = (Math.PI * 2) / this.divisions;

    this.rotate = makeRotator(this.tiltRad, this.yawRad);

    this.gridData = new PlanetGrid(this.divisions);

    this.lastRevealAt = this.scene.time.now;

    this.behind = scene.add.container(0, 0);
    this.add(this.behind);

    this.base = scene.add.graphics();
    this.tiles = scene.add.graphics();
    this.grid = scene.add.graphics();
    this.lifeBumps = scene.add.graphics();

    this.add(this.base);
    this.add(this.tiles);
    this.add(this.grid);
    this.add(this.lifeBumps);

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

    this.startPlanetRotation(2000);

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate);
    });
  }

  protected redrawForRotation() {
    log('redrawing for rotation');
    this.redrawTiles();

    drawWireGrid(
      this.grid,
      this.r,
      this.divisions,
      this.wireEvery,
      this.wireWidth,
      this.wireAlpha,
      this.rotate
    );

    this.onAfterTilesRedraw();
  }

  protected startPlanetRotation(stepEveryMs = 2000) {
    if (this.rotationEvent) return;

    this.rotationEvent = this.scene.time.addEvent({
      delay: stepEveryMs,
      loop: true,
      callback: () => {
        this.yawRad += this.yawStepRad;
        this.updateRotator();
        this.redrawForRotation();
      }
    });
  }

  protected onAfterTilesRedraw() { }

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
