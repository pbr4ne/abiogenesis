import Phaser from "phaser";
import TerraformingView from "./TerraformingView";
import HydrosphereMap from "./HydrosphereMap";

export default class Hydrosphere extends TerraformingView {
  private map: HydrosphereMap;

  private cols = 32;
  private rows = 18;

  private waterTimer?: Phaser.Time.TimerEvent;

  private static readonly SLOT_COL_START = 4;
  private static readonly SLOT_COL_END = 13;
  private static readonly SLOT_ROWS = 4;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const slotCols = (Hydrosphere.SLOT_COL_END - Hydrosphere.SLOT_COL_START + 1);
    const slotCount = slotCols * Hydrosphere.SLOT_ROWS;

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

      backButtonLocalX: 800,
      backButtonLocalY: -400,

      thermoLocalX: -840,
      thermoTopLocalY: -200,
      thermoH: 700,
      thermoW: 60,

      deviceKeys: ["hydrosphereDevice1", "hydrosphereDevice2", "hydrosphereDevice3"],

      deviceCosts: { 0: 5, 1: 20, 2: 100 },
      deviceRates: { 0: 1, 1: 5, 2: 10 },

      onBackEvent: "ui:goToPlanet",

      slotCount
    });

    this.map = new HydrosphereMap(this.cols, this.rows);

    this.startWaterRise();
    this.drawGridLines();

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.waterTimer?.remove(false);
    });
  }

  protected override getSlotTransform(slotIndex: number) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    const left = -w / 2;
    const top = -h / 2;

    const stepX = w / this.cols;
    const stepY = h / this.rows;

    const slotCols = (Hydrosphere.SLOT_COL_END - Hydrosphere.SLOT_COL_START + 1);

    const rowOffset = Math.floor(slotIndex / slotCols);
    const colOffset = slotIndex % slotCols;

    const row = (this.rows - Hydrosphere.SLOT_ROWS) + rowOffset;
    const col = Hydrosphere.SLOT_COL_START + colOffset;

    const x = left + (col + 0.5) * stepX;
    const y = top + (row + 0.5) * stepY;

    return { x, y, rotation: 0 };
  }

  private startWaterRise() {
    const target = Phaser.Math.Clamp(this.map.waterLevel + 5, 0, 7);

    this.waterTimer = this.scene.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        if (this.map.waterLevel >= target) {
          this.waterTimer?.remove(false);
          return;
        }
        this.map.waterLevel++;
        this.drawGridLines();
      }
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

    const stepX = w / this.cols;
    const stepY = h / this.rows;

    g.fillStyle(0x0b0f18, 1);
    g.fillRect(left, top, w, h);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const alt = this.map.getAltitude(r, c);
        const x = left + c * stepX;
        const y = top + r * stepY;

        const landCol = this.lerpColour(0x3a2f23, 0xc2a46a, alt / 7);
        g.fillStyle(landCol, 1);
        g.fillRect(x, y, stepX + 1, stepY + 1);

        if (alt < this.map.waterLevel) {
          const depth = this.map.waterLevel - alt;
          const t = Phaser.Math.Clamp((depth - 1) / 6, 0, 1);
          const tt = t * t * t;

          const waterCol = this.lerpColour(0x6fe6ff, 0x000f4a, tt);

          g.fillStyle(waterCol, 1);
          g.fillRect(x, y, stepX + 1, stepY + 1);
        }
      }
    }

    g.lineStyle(2, 0x0f0f0f, 0.50);

    for (let i = 0; i <= this.cols; i++) {
      const x = left + i * stepX;
      g.lineBetween(x, top, x, top + h);
    }

    for (let j = 0; j <= this.rows; j++) {
      const y = top + j * stepY;
      g.lineBetween(left, y, left + w, y);
    }
  }

  private lerpColour(a: number, b: number, t: number) {
    const ar = (a >> 16) & 0xff;
    const ag = (a >> 8) & 0xff;
    const ab = a & 0xff;

    const br = (b >> 16) & 0xff;
    const bg = (b >> 8) & 0xff;
    const bb = b & 0xff;

    return (
      (Math.round(Phaser.Math.Linear(ar, br, t)) << 16) |
      (Math.round(Phaser.Math.Linear(ag, bg, t)) << 8) |
      Math.round(Phaser.Math.Linear(ab, bb, t))
    );
  }
}
