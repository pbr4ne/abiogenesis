import Phaser from "phaser";

export type TerraformKey = "atmosphere" | "magnetosphere" | "hydrosphere";

export default class TerraformingState extends Phaser.Events.EventEmitter {
  private _atmosphereLevel = 0;
  private _magnetosphereLevel = 0;
  private _hydrosphereLevel = 0;

  get atmosphereLevel() { return this._atmosphereLevel; }
  get magnetosphereLevel() { return this._magnetosphereLevel; }
  get hydrosphereLevel() { return this._hydrosphereLevel; }

  setAtmosphereLevel(v: number) {
    const next = Phaser.Math.Clamp(v, 0, 1);
    if (next === this._atmosphereLevel) return;
    this._atmosphereLevel = next;
    this.emit("change", "atmosphere", next);
  }

  setMagnetosphereLevel(v: number) {
    const next = Phaser.Math.Clamp(v, 0, 1);
    if (next === this._magnetosphereLevel) return;
    this._magnetosphereLevel = next;
    this.emit("change", "magnetosphere", next);
  }

  setHydrosphereLevel(v: number) {
    const next = Phaser.Math.Clamp(Math.round(v), 0, 7);
    if (next === this._hydrosphereLevel) return;
    this._hydrosphereLevel = next;
    this.emit("change", "hydrosphere", next);
  }
}

export const getTerraformingState = (scene: Phaser.Scene) => {
  const key = "terraformingState";
  let s = scene.registry.get(key) as TerraformingState | undefined;
  if (!s) {
    s = new TerraformingState();
    scene.registry.set(key, s);
  }
  return s;
};
