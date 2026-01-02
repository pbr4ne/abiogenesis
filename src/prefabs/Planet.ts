import Phaser from "phaser";
import { makeRotator, pickCellByNearestProjectedCenter, projectLatLon } from "../planet/PlanetMath";
import { drawBaseGradient, drawTiles, drawWireGrid } from "../planet/PlanetRenderer";
import PlanetGrid from "../planet/PlanetGrid";
import MagneticField from "./MagneticField";

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

  private hotspotGroups: {
    key: string;
    event: string;
    baseA: number;
    hoverA: number;
    colourHex: string;
    cells: { row: number; col: number }[];
    cellSet: Set<string>;
  }[] = [];

  private hoveredGroupKey: string | null = null;

  private magField?: MagneticField;

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

    const keyOf = (row: number, col: number) => `${row},${col}`;

    const atmosphereCells = () => {
      const out: { row: number; col: number }[] = [];
      for (let row = 0; row <= 4; row++) {
        for (let col = 0; col <= this.divisions - 1; col++) {
          out.push({ row, col });
        }
      }
      return out;
    };

    const magnetosphereCells: { row: number; col: number }[] = [
      { row: 15, col: 7 },
      { row: 16, col: 7 },
      { row: 17, col: 7 },
      { row: 18, col: 7 },
      { row: 15, col: 8 },
      { row: 16, col: 8 },
      { row: 17, col: 8 },
      { row: 18, col: 8 },
      { row: 19, col: 8 },
      { row: 20, col: 8 },
      { row: 15, col: 9 },
      { row: 16, col: 9 },
      { row: 17, col: 9 },
      { row: 18, col: 9 },
      { row: 19, col: 9 },
      { row: 20, col: 9 },
      { row: 21, col: 9 },
      { row: 16, col: 10 },
      { row: 17, col: 10 },
      { row: 18, col: 10 },
      { row: 19, col: 10 }
    ];

    this.hotspotGroups = [
      {
        key: "atmosphere",
        event: "ui:goToAtmosphere",
        baseA: 0.45,
        hoverA: 0.85,
        colourHex: "#ffd84d",
        cells: atmosphereCells(),
        cellSet: new Set<string>()
      },
      {
        key: "magnetosphere",
        event: "ui:goToMagnetosphere",
        baseA: 0.45,
        hoverA: 0.85,
        colourHex: "#9dff4d",
        cells: magnetosphereCells,
        cellSet: new Set<string>()
      }
    ];

    for (const g of this.hotspotGroups) {
      for (const c of g.cells) {
        g.cellSet.add(keyOf(c.row, c.col));
        this.gridData.setHex(c.row, c.col, g.colourHex, g.baseA);
      }
    }

    this.lastRevealAt = this.scene.time.now;

    this.magField = new MagneticField(scene, this, {
      r: this.r,
      centerX: 0,
      centerY: 0,

      lineAlpha: 0.2,
      lineWidth: 2,

      perSideLines: 5,

      loopCenterOffsetMul: 1,
      innerRadiusMul: 0.15,
      outerRadiusMul: 1.35,

      strengthOverride01: 1
    });

    this.base = scene.add.graphics();
    this.tiles = scene.add.graphics();
    this.grid = scene.add.graphics();

    this.add(this.base);
    this.add(this.tiles);
    this.add(this.grid);

    drawBaseGradient(this.base, this.r, 0);
    drawTiles(this.tiles, this.r, this.divisions, 2, this.rotate, this.gridData.getCellsRef());
    drawWireGrid(this.grid, this.r, this.divisions, 160, 3, 0.35, this.rotate);

    this.hitZone = scene.add.zone(-this.r, -this.r, this.diameter, this.diameter);
    this.hitZone.setOrigin(0, 0);
    this.hitZone.setInteractive(new Phaser.Geom.Circle(this.r, this.r, this.r), Phaser.Geom.Circle.Contains);
    this.add(this.hitZone);

    this.scene.events.on(Phaser.Scenes.Events.WAKE, this.clearHotspotHover, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.WAKE, this.clearHotspotHover, this);
    });

    this.hitZone.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const dx = pointer.worldX - this.x;
      const dy = pointer.worldY - this.y;

      const cell = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);

      let nextKey: string | null = null;

      if (cell) {
        const k = `${cell.row},${cell.col}`;
        for (const g of this.hotspotGroups) {
          if (g.cellSet.has(k)) {
            nextKey = g.key;
            break;
          }
        }
      }

      if (nextKey === this.hoveredGroupKey) return;

      if (this.hoveredGroupKey !== null) {
        const prev = this.hotspotGroups.find(g => g.key === this.hoveredGroupKey)!;
        for (const c of prev.cells) {
          this.gridData.setHex(c.row, c.col, prev.colourHex, prev.baseA);
        }
        this.scene.input.setDefaultCursor("default");
      }

      this.hoveredGroupKey = nextKey;

      if (nextKey !== null) {
        const cur = this.hotspotGroups.find(g => g.key === nextKey)!;
        for (const c of cur.cells) {
          this.gridData.setHex(c.row, c.col, cur.colourHex, cur.hoverA);
        }
        this.scene.input.setDefaultCursor("pointer");
      }

      drawTiles(this.tiles, this.r, this.divisions, 2, this.rotate, this.gridData.getCellsRef());
    });

    this.hitZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const dx = pointer.worldX - this.x;
      const dy = pointer.worldY - this.y;

      const cell = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);
      if (!cell) return;

      const k = `${cell.row},${cell.col}`;

      for (const g of this.hotspotGroups) {
        if (g.cellSet.has(k)) {
          this.clearHotspotHover();
          this.scene.events.emit(g.event);
          return;
        }
      }
    });

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

  public getGridData() {
    return this.gridData;
  }

  private clearHotspotHover() {
    if (!this.hotspotGroups?.length) return;

    this.hoveredGroupKey = null;

    for (const g of this.hotspotGroups) {
      for (const c of g.cells) {
        this.gridData.setHex(c.row, c.col, g.colourHex, g.baseA);
      }
    }

    drawTiles(this.tiles, this.r, this.divisions, 2, this.rotate, this.gridData.getCellsRef());
    this.scene.input.setDefaultCursor("default");
  }
}
