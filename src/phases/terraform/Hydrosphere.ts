import Phaser from "phaser";
import TerraformingView from "./TerraformingView";
import HydrosphereMap from "./HydrosphereMap";
import { getTerraformingState } from "./TerraformingState";

export default class Hydrosphere extends TerraformingView {
  private map: HydrosphereMap;

  private cols = 32;
  private rows = 18;

  private slotCells: { r: number; c: number }[] = [];

  private static readonly SLOT_ROW_START_1 = 2;
  private static readonly SLOT_ROW_END_1 = 13;

  private static readonly SLOT_COL_START_1 = 4;
  private static readonly SLOT_COL_END_1 = 27;

  private static readonly LOW_ALT_MAX = 3;
  private static readonly SLOT_COUNT = 20;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const cols = 32;
    const rows = 18;

    const row0Start = Hydrosphere.SLOT_ROW_START_1 - 1;
    const row0End = Hydrosphere.SLOT_ROW_END_1 - 1;
    const col0Start = Hydrosphere.SLOT_COL_START_1 - 1;
    const col0End = Hydrosphere.SLOT_COL_END_1 - 1;

    const preMap = new HydrosphereMap(cols, rows);

    const progress = getTerraformingState(scene);
    preMap.waterLevel = progress.waterLevel;

    preMap.ensureAtLeastLowCellsInRect(
      row0Start,
      row0End,
      col0Start,
      col0End,
      Hydrosphere.LOW_ALT_MAX,
      Hydrosphere.SLOT_COUNT
    );

    const lowCells = preMap.getLowCellsInRect(
      row0Start,
      row0End,
      col0Start,
      col0End,
      Hydrosphere.LOW_ALT_MAX
    );

    Phaser.Utils.Array.Shuffle(lowCells);
    const slotCells = lowCells.slice(0, Hydrosphere.SLOT_COUNT);

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

      slotCount: Hydrosphere.SLOT_COUNT
    });

    this.map = preMap;
    this.slotCells = slotCells;

    this.drawGridLines();
    this.onPointsChanged();
  }

  protected override getSlotTransform(slotIndex: number) {
    const cell = this.slotCells[slotIndex] ?? this.slotCells[this.slotCells.length - 1];

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    const left = -w / 2;
    const top = -h / 2;

    const stepX = w / this.cols;
    const stepY = h / this.rows;

    const x = left + (cell.c + 0.5) * stepX;
    const y = top + (cell.r + 0.5) * stepY;

    return { x, y, rotation: 0 };
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

  protected override getSlotCellSize(): number {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    const stepX = w / this.cols;
    const stepY = h / this.rows;

    return Math.min(stepX, stepY);
  }

  protected override onPointsChanged() {
    const state = getTerraformingState(this.scene);

    const ratio = Phaser.Math.Clamp(this.points / this.thermometerMax, 0, 1);
    const waterLevel = Math.round(Phaser.Math.Linear(0, 7, ratio));

    if (waterLevel === this.map.waterLevel) return;

    this.map.waterLevel = waterLevel;
    state.setWaterLevel(waterLevel);

    this.drawGridLines();
  }
}
