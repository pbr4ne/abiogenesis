import Phaser from "phaser";
import type { AltGrid } from "../phases/terraform/HydrosphereTerrain";
import { enforceGlobalAltSplit5050, generateAltGrid } from "../phases/terraform/HydrosphereTerrain";
import { LifeFormInstance, LifeFormType } from "../phases/evolution/EvolutionTypes";
import { getUrlParam, log } from "../utilities/GameUtils";

export type TerraformLevels = {
  atmosphere: number;
  magnetosphere: number;
  hydrosphere: number;
  core: number;
};

export default class PlanetRunState {
  public readonly seed: string;
  public readonly hydroAlt: AltGrid;
  public lifeForms: LifeFormInstance[] = [];
  public nextLifeId = 1;

  public waterLevel: number = 0;

  public unlockedLifeTypes = new Set<LifeFormType>();

  public terraform: TerraformLevels;
  public evoPointsBank = 1;

  constructor(divisions: number, seed?: string) {
    this.seed = seed ?? Phaser.Math.RND.uuid();
    const rng = new Phaser.Math.RandomDataGenerator([this.seed]);
    this.hydroAlt = generateAltGrid(divisions, divisions, rng);
    enforceGlobalAltSplit5050(this.hydroAlt, 10, 20, rng);

    const sceneOverride = getUrlParam("scene");
    if (sceneOverride !== null && sceneOverride != "Terraforming") {
      this.waterLevel = 10;
      log(`Overriding water level to ${this.waterLevel}`);
    }

    this.terraform = {
      atmosphere: 5,
      magnetosphere: 5,
      hydrosphere: 5,
      core: 5
    };
  }

  public makeLifeId() {
    return `lf_${this.nextLifeId++}`;
  }

  public getEvoPointsAvailable() {
    return Math.floor(this.evoPointsBank);
  }

  public addEvoPoints(v: number) {
    if (!Number.isFinite(v) || v <= 0) return;
    this.evoPointsBank += v;
    if (this.evoPointsBank > 9999) this.evoPointsBank = 9999;
  }

  public trySpendEvoPoints(n: number) {
    const need = Math.max(0, Math.floor(n));
    if (need <= 0) return true;
    if (this.evoPointsBank < need) return false;
    this.evoPointsBank -= need;
    if (this.evoPointsBank < 0) this.evoPointsBank = 0;
    return true;
  }
}
