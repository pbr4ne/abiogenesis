import PlanetRunState from "../../planet/PlanetRunState";
import PlanetBase from "../../planet/PlanetBase";
import { paintHydrosphere } from "../terraform/HydrosphereMap";
import { ensureStartingProkaryotes } from "./EvolutionSpawn";
import { LIFEFORMS } from "./LifeForms";
import { drawCellBump } from "../../planet/PlanetRenderer";

const rgbToHexStr = (r: number, g: number, b: number) =>
  "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

export default class EvolutionPlanet extends PlanetBase {
  private run: PlanetRunState;

  constructor(scene: Phaser.Scene, x = 960, y = 540) {
    super(scene, x, y);
    this.run = scene.registry.get("run") as PlanetRunState;

    paintHydrosphere(this.gridData, this.run.hydroAlt, this.run.waterLevel);

    ensureStartingProkaryotes(
      this.run,
      this.divisions,
      (row, col) => this.run.hydroAlt[row][col] <= this.run.waterLevel
    );

    this.renderLifeForms();
    this.renderLifeBumps();
    this.redrawTiles();
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
