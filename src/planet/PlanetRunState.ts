import Phaser from "phaser";
import type { AltGrid } from "../phases/terraform/HydrosphereTerrain";
import { generateAltGrid } from "../phases/terraform/HydrosphereTerrain";

export default class PlanetRunState {
  public readonly seed: string;
  public readonly hydroAlt: AltGrid;

  public waterLevel: number = 5;

  constructor(divisions: number, seed?: string) {
    this.seed = seed ?? Phaser.Math.RND.uuid();
    const rng = new Phaser.Math.RandomDataGenerator([this.seed]);
    this.hydroAlt = generateAltGrid(divisions, divisions, rng);
  }
}
