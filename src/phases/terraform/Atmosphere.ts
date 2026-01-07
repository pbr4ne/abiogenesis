import TerraformingView from "./TerraformingView";
import { getTerraforming } from "./getTerraformingState";

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

      slotCount: 20,
      thermoMax: 6000,
      points: 5,
      deviceCosts: { 0: 5, 1: 50, 2: 250 },
      deviceRates: { 0: 1, 1: 2, 2: 8 },

      deviceButtonTheme: {
        stroke: [0xf2b7d8, 0xf06fb4, 0xff2f9f],
        glow: [0xf8d3e8, 0xf5a0cf, 0xff8fc9],
        hoverStrokeMul: 0.35
      },

      onBackEvent: "ui:goToPlanet",
      thermoColour: 0xff66cc,
    });
  }

  protected onPointsChanged() {
    const tf = getTerraforming(this.scene);
    const level = Phaser.Math.Clamp(Math.round(this.points), 0, this.thermometerMax);
    tf.setAtmosphereLevel(level);
  }
}
