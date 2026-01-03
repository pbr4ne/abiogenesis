import Phaser from "phaser";

export type TerraformKey = "atmosphere" | "magnetosphere" | "hydrosphere";

export default class TerraformingState extends Phaser.Events.EventEmitter {
  private _atmosphere01 = 0;
  private _magnetosphere01 = 0;
  private _waterLevel = 0;

  get atmosphere01() { return this._atmosphere01; }
  get magnetosphere01() { return this._magnetosphere01; }
  get waterLevel() { return this._waterLevel; }

  setAtmosphere01(v: number) {
    const next = Phaser.Math.Clamp(v, 0, 1);
    if (next === this._atmosphere01) return;
    this._atmosphere01 = next;
    this.emit("change", "atmosphere", next);
  }

  setMagnetosphere01(v: number) {
    const next = Phaser.Math.Clamp(v, 0, 1);
    if (next === this._magnetosphere01) return;
    this._magnetosphere01 = next;
    this.emit("change", "magnetosphere", next);
  }

  setWaterLevel(v: number) {
    const next = Phaser.Math.Clamp(Math.round(v), 0, 7);
    if (next === this._waterLevel) return;
    this._waterLevel = next;
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
