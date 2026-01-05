import Phaser from "phaser";
import type { AltGrid } from "../phases/terraform/HydrosphereTerrain";
import { generateAltGrid } from "../phases/terraform/HydrosphereTerrain";
import { LifeFormInstance, LifeFormType } from "../phases/evolution/EvolutionTypes";

export type TerraformLevels = {
  atmosphere: number;
  magnetosphere: number;
  hydrosphere: number;
};

export default class PlanetRunState {
  public readonly seed: string;
  public readonly hydroAlt: AltGrid;
  public lifeForms: LifeFormInstance[] = [];
  public nextLifeId = 1;

  public waterLevel: number = 0;

  public unlockedLifeTypes = new Set<LifeFormType>();

  public terraform: TerraformLevels;

  constructor(divisions: number, seed?: string) {
    this.seed = seed ?? Phaser.Math.RND.uuid();
    const rng = new Phaser.Math.RandomDataGenerator([this.seed]);
    this.hydroAlt = generateAltGrid(divisions, divisions, rng);

    this.terraform = {
      atmosphere: 5,
      magnetosphere: 5,
      hydrosphere: 5
    };
  }

  public makeLifeId() {
    return `lf_${this.nextLifeId++}`;
  }
}
