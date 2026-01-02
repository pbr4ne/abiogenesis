import Phaser from "phaser";
import PlanetBase, { PlanetBaseConfig } from "./PlanetBase";

export default class PrimordialSoupPlanet extends PlanetBase {
  constructor(scene: Phaser.Scene, x = 960, y = 540, cfg: PlanetBaseConfig = {}) {
    super(scene, x, y, cfg);
  }
}
