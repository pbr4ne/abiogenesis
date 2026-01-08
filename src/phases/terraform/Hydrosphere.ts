import Phaser from "phaser";
import TerraformingView from "./TerraformingView";
import HydrosphereMap from "./HydrosphereMap";
import { terrainColour } from "./HydrosphereTerrain";
import { getTerraforming } from "./getTerraformingState";

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
    const tf = getTerraforming(scene);

    const cols = 32;
    const rows = 18;

    const row0Start = Hydrosphere.SLOT_ROW_START_1 - 1;
    const row0End = Hydrosphere.SLOT_ROW_END_1 - 1;
    const col0Start = Hydrosphere.SLOT_COL_START_1 - 1;
    const col0End = Hydrosphere.SLOT_COL_END_1 - 1;

    const preMap = new HydrosphereMap(cols, rows);
    preMap.waterLevel = tf.waterStep10();

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

      slotCount: Hydrosphere.SLOT_COUNT,
      thermoMax: 6000,
      points: 5,
      deviceCosts: { 0: 5, 1: 50, 2: 250 },
      deviceRates: { 0: 1, 1: 2, 2: 8 },

      deviceButtonTheme: {
        stroke: [0xa8d5ba, 0x5fbf8a, 0x2ecc71],
        glow: [0xd7efe1, 0x9ee4c4, 0x8af5c2],
        hoverStrokeMul: 0.35
      },

      onBackEvent: "ui:goToPlanet",

      thermoColour: 0x5fbf8a,
    });

    this.map = preMap;
    this.slotCells = slotCells;

    this.points = Phaser.Math.Clamp(tf.hydrosphereLevel, 0, this.thermometerMax);
    this.thermometer.setValue(this.points);

    this.drawGridLines();
    this.onPointsChanged();
  }

  protected override getName() {
    return "Hydrosphere";
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

        const col = terrainColour(alt, this.map.waterLevel);
        g.fillStyle(col, 1);
        g.fillRect(x, y, stepX + 1, stepY + 1);
      }
    }

    g.lineStyle(2, 0x0f0f0f, 0.5);

    for (let i = 0; i <= this.cols; i++) {
      const x = left + i * stepX;
      g.lineBetween(x, top, x, top + h);
    }

    for (let j = 0; j <= this.rows; j++) {
      const y = top + j * stepY;
      g.lineBetween(left, y, left + w, y);
    }
  }

  protected override getSlotCellSize(): number {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    const stepX = w / this.cols;
    const stepY = h / this.rows;

    return Math.min(stepX, stepY);
  }

  protected override onPointsChanged() {
    const tf = getTerraforming(this.scene);

    const level = Phaser.Math.Clamp(Math.round(this.points), 0, this.thermometerMax);
    tf.setHydrosphereLevel(level);

    const nextWater = tf.waterStep10();
    if (nextWater === this.map.waterLevel) return;

    this.map.waterLevel = nextWater;
    this.drawGridLines();
  }

  protected override deviceSlotsFillCell(): boolean {
    return true;
  }

  protected override deviceSlotsFillBg(): number {
    return 0x061a33;
  }
}
