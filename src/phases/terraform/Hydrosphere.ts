import TerraformingView from "./TerraformingView";
import Phaser from "phaser";

export default class Hydrosphere extends TerraformingView {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      diameter: 1600,
      offsetRatio: 0.5,

      arcStartDeg: 0,
      arcEndDeg: 360,
      radiusOffset: -120,

      worldCenterLocalY: 0,
      renderPlanetEdge: false,

      flipWorldY: false,

      buttonRowLocalY: 915 - y,

      backButtonLocalX: 820,
      backButtonLocalY: -1080,

      thermoLocalX: -840,
      thermoTopLocalY: -200,
      thermoH: 700,
      thermoW: 60,

      deviceKeys: ["hydrosphereDevice1", "hydrosphereDevice2", "hydrosphereDevice3"],

      deviceCosts: { 0: 5, 1: 20, 2: 100 },
      deviceRates: { 0: 1, 1: 5, 2: 10 },

      onBackEvent: "ui:goToPlanet"
    });
  }

  protected override drawGridLines() {
    const g = this.grid;
    g.clear();
    g.setPosition(0, 0);

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    const left = -w / 2;
    const top = -h / 2;

    g.fillStyle(0x0b0f18, 1);
    g.fillRect(left, top, w, h);

    const cellsX = 32;
    const cellsY = 18;

    const stepX = w / cellsX;
    const stepY = h / cellsY;

    g.lineStyle(2, 0xffffff, 0.10);

    for (let i = 0; i <= cellsX; i++) {
      const x = left + i * stepX;
      g.lineBetween(x, top, x, top + h);
    }

    for (let j = 0; j <= cellsY; j++) {
      const y = top + j * stepY;
      g.lineBetween(left, y, left + w, y);
    }
  }
}
