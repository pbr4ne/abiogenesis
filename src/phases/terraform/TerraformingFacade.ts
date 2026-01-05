import Phaser from "phaser";
import PlanetRunState from "../../planet/PlanetRunState";

export type TerraformKey = "atmosphere" | "magnetosphere" | "hydrosphere";

export type TerraformLevels = {
  atmosphere: number;
  magnetosphere: number;
  hydrosphere: number;
};

export default class TerraformingFacade extends Phaser.Events.EventEmitter {
  public static readonly MAX = 1000;

  private run: PlanetRunState;

  constructor(run: PlanetRunState) {
    super();
    this.run = run;

    if (!this.run.terraform) {
      this.run.terraform = {
        atmosphere: 5,
        magnetosphere: 5,
        hydrosphere: 5
      };
    }
  }

  public get atmosphereLevel() {
    return this.run.terraform.atmosphere;
  }

  public get magnetosphereLevel() {
    return this.run.terraform.magnetosphere;
  }

  public get hydrosphereLevel() {
    return this.run.terraform.hydrosphere;
  }

  public setAtmosphereLevel(v: number) {
    this.setLevel("atmosphere", v);
  }

  public setMagnetosphereLevel(v: number) {
    this.setLevel("magnetosphere", v);
  }

  public setHydrosphereLevel(v: number) {
    this.setLevel("hydrosphere", v);
  }

  public isComplete() {
    return (
      this.atmosphereLevel >= TerraformingFacade.MAX &&
      this.magnetosphereLevel >= TerraformingFacade.MAX &&
      this.hydrosphereLevel >= TerraformingFacade.MAX
    );
  }

  public ratio01(k: TerraformKey) {
    return Phaser.Math.Clamp(this.getLevel(k) / TerraformingFacade.MAX, 0, 1);
  }

  public waterStep10() {
    return Phaser.Math.Clamp(Math.floor(this.ratio01("hydrosphere") * 11), 0, 10);
  }

  private getLevel(k: TerraformKey) {
    return this.run.terraform[k];
  }

  private setLevel(k: TerraformKey, v: number) {
    const next = Phaser.Math.Clamp(Math.round(v), 0, TerraformingFacade.MAX);
    const prev = this.run.terraform[k];
    if (next === prev) return;

    this.run.terraform[k] = next;

    this.emit("change", k, next);
    this.emit(`change:${k}`, next);
    this.emit("maybeComplete");
  }
}
