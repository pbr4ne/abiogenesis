import TerraformingView from "./TerraformingView";
import { getTerraformingState } from "./TerraformingState";
import MagnetosphereRenderer from "./MagnetosphereRenderer";

type MagnetosphereConfig = {
  diameter: number;
  offsetRatio: number;
  arcStartDeg: number;
  arcEndDeg: number;
  radiusOffset: number;
};

export default class Magnetosphere extends TerraformingView {
  private magField?: MagnetosphereRenderer;

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

    this.onPointsChanged();
  }

  protected override createBehindWorldOverlays() {
    this.magField = new MagnetosphereRenderer(this.scene, this.behindWorld, {
      r: this.r,
      centerX: 0,
      centerY: this.worldCenterLocalY,

      lineAlpha: 0.18,
      lineWidth: 2,

      perSideLines: 5,

      loopCenterOffsetMul: 0.62,
      innerRadiusMul: 0.55,
      outerRadiusMul: 1.85,

      strengthOverride01: null
    });

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.magField?.destroy();
      this.magField = undefined;
    });
  }

  protected override onTick() {
    const ratio = Phaser.Math.Clamp(this.points / this.thermometerMax, 0, 1);
    this.magField?.setStrength01(ratio);
  }

  protected override onPointsChanged() {
    const ratio = Phaser.Math.Clamp(this.points / this.thermometerMax, 0, 1);
    getTerraformingState(this.scene).setMagnetosphereLevel(ratio);
  }
}