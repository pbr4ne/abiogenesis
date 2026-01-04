import PlanetRunState from "../../planet/PlanetRunState";
import PlanetBase from "../../planet/PlanetBase";
import { paintHydrosphere } from "../terraform/HydrosphereMap";
import { ensureStartingProkaryotes } from "./EvolutionSpawn";
import { LIFEFORMS } from "./LifeForms";
import { drawCellBump } from "../../planet/PlanetRenderer";
import { LifeFormInstance } from "./EvolutionTypes";
import { pickCellByNearestProjectedCenter } from "../../planet/PlanetMath";
import { sprinkleLifeFormsDebug } from "./EvolutionDebugSprinkle";

const rgbToHexStr = (r: number, g: number, b: number) =>
  "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

export default class EvolutionPlanet extends PlanetBase {
  private run: PlanetRunState;

  private lifeByCell = new Map<string, LifeFormInstance>();
  private hoveredLifeId: string | null = null;

  constructor(scene: Phaser.Scene, x = 960, y = 540) {
    super(scene, x, y);
    this.run = scene.registry.get("run") as PlanetRunState;

    paintHydrosphere(this.gridData, this.run.hydroAlt, this.run.waterLevel);

    // ensureStartingProkaryotes(
    //   this.run,
    //   this.divisions,
    //   (row, col) => this.run.hydroAlt[row][col] <= this.run.waterLevel
    // );

    sprinkleLifeFormsDebug(
      this.run,
      this.divisions,
      this.run.hydroAlt,
      this.run.waterLevel,
      5
    );

    this.renderLifeForms();
    this.renderLifeBumps();
    this.redrawTiles();

    this.rebuildLifeIndex();
    this.enableLifeHover();
  }

  private keyOf(row: number, col: number) {
    return `${row},${col}`;
  }

  private rebuildLifeIndex() {
    this.lifeByCell.clear();
    for (const lf of this.run.lifeForms) {
      this.lifeByCell.set(this.keyOf(lf.row, lf.col), lf);
    }
  }

  public enableLifeHover() {
    this.onPlanetPointerMove(pointer => {
      const dx = pointer.worldX - this.x;
      const dy = pointer.worldY - this.y;

      const cell = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);
      if (!cell) {
        this.setCursorDefault();
        this.emitHover(null);
        return;
      }

      const lf = this.lifeByCell.get(this.keyOf(cell.row, cell.col)) ?? null;

      if (!lf) {
        this.setCursorDefault();
        this.emitHover(null);
        return;
      }

      this.setCursorPointer();

      if (this.hoveredLifeId !== lf.id) {
        this.hoveredLifeId = lf.id;
        this.emitHover(lf);
      }
    });
  }

  private emitHover(lf: LifeFormInstance | null) {
    if (!lf) {
      this.hoveredLifeId = null;
      this.scene.events.emit("life:hover", null);
      return;
    }

    const def = LIFEFORMS[lf.type];
    this.scene.events.emit("life:hover", { lf, def });
  }

  private setCursorPointer() {
    this.scene.input.setDefaultCursor("pointer");
  }

  private setCursorDefault() {
    this.scene.input.setDefaultCursor("default");
  }

  private renderLifeForms() {
    for (const lf of this.run.lifeForms) {
      const def = LIFEFORMS[lf.type];
      const hex = rgbToHexStr(def.colour.r, def.colour.g, def.colour.b);
      this.gridData.setHex(lf.row, lf.col, hex, 1);
    }
  }

  protected override onAfterTilesRedraw() {
    this.renderLifeBumps();
  }

  private renderLifeBumps() {
    this.lifeBumps.clear();

    for (const lf of this.run.lifeForms) {
      const def = LIFEFORMS[lf.type];
      const baseHex =
        (def.colour.r << 16) |
        (def.colour.g << 8) |
        def.colour.b;

      const heightPx = 6;

      drawCellBump(
        this.lifeBumps,
        lf.row,
        lf.col,
        this.r,
        this.divisions,
        this.rotate,
        baseHex,
        heightPx,
        1
      );
    }
  }
}
