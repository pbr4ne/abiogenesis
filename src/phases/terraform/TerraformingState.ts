import Phaser from "phaser";

export type TerraformKey = "atmosphere" | "magnetosphere" | "hydrosphere" | "core";

export default class TerraformingState extends Phaser.Events.EventEmitter {
  public static readonly MAX = 6000;

  private _atmosphereLevel = 0;
  private _magnetosphereLevel = 0;
  private _hydrosphereLevel = 0;
  private _coreLevel = 0;

  get atmosphereLevel() { return this._atmosphereLevel; }
  get magnetosphereLevel() { return this._magnetosphereLevel; }
  get hydrosphereLevel() { return this._hydrosphereLevel; }
  get coreLevel() { return this._coreLevel; }

  public isComplete() {
    return (
      this._atmosphereLevel >= TerraformingState.MAX &&
      this._magnetosphereLevel >= TerraformingState.MAX &&
      this._hydrosphereLevel >= TerraformingState.MAX &&
      this._coreLevel >= TerraformingState.MAX
    );
  }

  setAtmosphereLevel(v: number) {
    const next = Phaser.Math.Clamp(Math.round(v), 0, TerraformingState.MAX);
    if (next === this._atmosphereLevel) return;
    this._atmosphereLevel = next;
    this.emit("change", "atmosphere", next);
  }

  setMagnetosphereLevel(v: number) {
    const next = Phaser.Math.Clamp(Math.round(v), 0, TerraformingState.MAX);
    if (next === this._magnetosphereLevel) return;
    this._magnetosphereLevel = next;
    this.emit("change", "magnetosphere", next);
  }

  setHydrosphereLevel(v: number) {
    const next = Phaser.Math.Clamp(Math.round(v), 0, TerraformingState.MAX);
    if (next === this._hydrosphereLevel) return;
    this._hydrosphereLevel = next;
    this.emit("change", "hydrosphere", next);
  }

  setCoreLevel(v: number) {
    const next = Phaser.Math.Clamp(Math.round(v), 0, TerraformingState.MAX);
    if (next === this._coreLevel) return;
    this._coreLevel = next;
    this.emit("change", "core", next);
  }
}
