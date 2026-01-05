import Phaser from "phaser";
import TerraformingView from "./TerraformingView";
import { getTerraformingState } from "./TerraformingState";
import MagnetosphereRenderer from "./MagnetosphereRenderer";
import { getTerraforming } from "./getTerraformingState";

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

      flipWorldY: false,

      buttonLayout: "col",
      buttonLocalX: -800,
      buttonTopLocalY: 520,
      buttonRowLocalY: 0,

      backButtonLocalX: -800,
      backButtonLocalY: 230,

      thermoOrientation: "horizontal",
      thermoLocalX: -50,
      thermoTopLocalY: 200,
      thermoW: 700,
      thermoH: 60,
      arcStartDeg: 140,
      arcEndDeg: 220,

      deviceKeys: ["magnetosphereDevice1", "magnetosphereDevice2", "magnetosphereDevice3"],
      deviceCosts: { 0: 5, 1: 20, 2: 100 },
      deviceRates: { 0: 1, 1: 5, 2: 10 },

      deviceButtonTheme: {
        stroke: [0x9fbcd6, 0x5fa8e8, 0x3aa0ff],
        glow: [0xd6e6f3, 0xa6d4f5, 0x7ac6ff],
        hoverStrokeMul: 0.35
      },

      onBackEvent: "ui:goToPlanet"
    });

    this.world.x = 1620;

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
    const state = getTerraformingState(this.scene);
    const ratio01 = Phaser.Math.Clamp(state.magnetosphereLevel / 1000, 0, 1);
    this.magField?.setStrength01(ratio01);
  }

  protected override onPointsChanged() {
    const tf = getTerraforming(this.scene);
    const level = Phaser.Math.Clamp(Math.round(this.points), 0, this.thermometerMax);
    tf.setMagnetosphereLevel(level);
  }
}
