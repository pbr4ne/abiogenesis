import TerraformingView from "./TerraformingView";
import { getTerraformingState } from "./TerraformingState";

type AtmosphereConfig = {
  diameter: number;
  offsetRatio: number;
  arcStartDeg: number;
  arcEndDeg: number;
  radiusOffset: number;
};

export default class Atmosphere extends TerraformingView {
  constructor(scene: Phaser.Scene, x: number, y: number, cfg: AtmosphereConfig) {
    super(scene, x, y, {
      ...cfg,

      flipWorldY: false,

      buttonRowLocalY: 315 - y,

      backButtonLocalX: 820,
      backButtonLocalY: -1080,

      thermoLocalX: -820,
      thermoTopLocalY: -1000,
      thermoH: 700,
      thermoW: 60,

      deviceKeys: ["atmosphereDevice1", "atmosphereDevice2", "atmosphereDevice3"],

      deviceCosts: { 0: 5, 1: 20, 2: 100 },
      deviceRates: { 0: 1, 1: 5, 2: 10 },

      onBackEvent: "ui:goToPlanet"
    });
  }

  protected onPointsChanged() {
    const ratio = Phaser.Math.Clamp(this.points / this.thermometerMax, 0, 1);
    getTerraformingState(this.scene).setAtmosphereLevel(ratio);
  }
}
