import PlanetRunState from "../../planet/PlanetRunState";
import PlanetBase from "../../planet/PlanetBase";
import { paintHydrosphere } from "../terraform/HydrosphereMap";

export default class EvolutionPlanet extends PlanetBase {

  private run: PlanetRunState;

  constructor(scene: Phaser.Scene, x = 960, y = 540) {
    super(scene, x, y);
    this.run = scene.registry.get("run") as PlanetRunState;

    paintHydrosphere(this.gridData, this.run.hydroAlt, this.run.waterLevel);
    this.redrawTiles();
  }
}