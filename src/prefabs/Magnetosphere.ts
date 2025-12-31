import CapDeviceView from "./CapDeviceView";

type MagnetosphereConfig = {
  diameter: number;
  offsetRatio: number;
  arcStartDeg: number;
  arcEndDeg: number;
  radiusOffset: number;
};

export default class Magnetosphere extends CapDeviceView {
  constructor(scene: Phaser.Scene, x: number, y: number, cfg: MagnetosphereConfig) {
    super(scene, x, y, {
      ...cfg,

      flipWorldY: true,

      buttonRowLocalY: 1080 - 240 - y,

      backButtonLocalX: 820,
      backButtonLocalY: 950,

      thermoLocalX: -820,
      thermoTopLocalY: 300,
      thermoH: 700,
      thermoW: 60,

      deviceKeys: ["magnetosphereDevice1", "magnetosphereDevice2", "magnetosphereDevice3"],

      deviceCosts: { 0: 5, 1: 20, 2: 100 },
      deviceRates: { 0: 1, 1: 5, 2: 10 },

      onBackEvent: "ui:goToPlanet"
    });
  }
}
