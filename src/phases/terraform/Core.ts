import Phaser from "phaser";
import CoreMap from "./CoreMap";
import { terrainColour } from "./HydrosphereTerrain";
import { getTerraforming } from "./getTerraformingState";
import TerraformingView from "./TerraformingView";

const CORE_SURFACE = 0x291e16;
const CORE_ABYSS = 0x020308;

const blendTo = (from: number, to: number, t: number) => {
  const k = Phaser.Math.Clamp(t, 0, 1);

  const fr = (from >> 16) & 0xff;
  const fg = (from >> 8) & 0xff;
  const fb = from & 0xff;

  const tr = (to >> 16) & 0xff;
  const tg = (to >> 8) & 0xff;
  const tb = to & 0xff;

  const r = Math.round(Phaser.Math.Linear(fr, tr, k));
  const g = Math.round(Phaser.Math.Linear(fg, tg, k));
  const b = Math.round(Phaser.Math.Linear(fb, tb, k));

  return (r << 16) | (g << 8) | b;
};

export default class Core extends TerraformingView {
  private map: CoreMap;

  private cols = 32;
  private rows = 18;

  private slotCells: { r: number; c: number }[] = [];

  private static readonly SLOT_COUNT = 36;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const tf = getTerraforming(scene);

    const cols = 32;
    const rows = 18;

    const preMap = new CoreMap(cols, rows, {
      seed: "core-map",
      holeRadiusCells: 5
    });

    const ring = preMap.getHoleInnerEdgeCells(true);
    Phaser.Utils.Array.Shuffle(ring);
    const slotCells = ring.slice(0, Core.SLOT_COUNT);

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

      thermoOrientation: "horizontal",
      thermoLocalX: 0,
      thermoTopLocalY: -450,
      thermoW: 700,
      thermoH: 60,

      deviceKeys: ["coreDevice1", "coreDevice2", "coreDevice3"],

      slotCount: Core.SLOT_COUNT,
      thermoMax: 4000,
      points: 5,
      deviceCosts: { 0: 5, 1: 50, 2: 250 },
      deviceRates: { 0: 1, 1: 2, 2: 8 },

      deviceButtonTheme: {
        stroke: [0xffc400, 0xffcf33, 0xffffb3],
        glow: [0xfff0a6, 0xfff4b8, 0xffffea],
        hoverStrokeMul: 0.35
      },

      onBackEvent: "ui:goToPlanet",

      thermoColour: 0xffc400
    });

    this.cols = cols;
    this.rows = rows;
    this.map = preMap;
    this.slotCells = slotCells;

    this.points = Phaser.Math.Clamp((tf as any).coreLevel ?? 0, 0, this.thermometerMax);
    this.thermometer.setValue(this.points);

    this.drawGridLines();
    this.onPointsChanged();
  }

  protected override getName() {
    return "Core";
  }

  protected override getPlusMode(): "rotate" | "straight" {
    return "straight";
  }

  private coreHeat01() {
    const start = 10;
    const max = this.thermometerMax;
    const t = Phaser.Math.Clamp((this.points - start) / Math.max(1, (max - start)), 0, 1);
    return Phaser.Math.Easing.Cubic.Out(t);
  }

  protected override getSlotTransform(slotIndex: number) {
    const cell =
      this.slotCells[slotIndex] ??
      this.slotCells[this.slotCells.length - 1];

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    const left = -w / 2;
    const top = -h / 2;

    const stepX = w / this.cols;
    const stepY = h / this.rows;

    const x = left + (cell.c + 0.5) * stepX;
    const y = top + (cell.r + 0.5) * stepY;

    const hole = this.map.getHoleInfo();
    const hx = left + hole.cx * stepX;
    const hy = top + hole.cy * stepY;

    const dx = hx - x;
    const dy = hy - y;

    const rotation = Math.atan2(dy, dx) + Math.PI / 2 + Math.PI;

    return { x, y, rotation };
  }

  protected override getSlotCellSize(): number {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    const stepX = w / this.cols;
    const stepY = h / this.rows;

    return Math.min(stepX, stepY);
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

        let col = terrainColour(alt, 0);

        if (this.map.isHole(r, c)) {
          const d = this.map.getHoleDepth01(r, c);

          let col2 = blendTo(col, CORE_SURFACE, 0.98);
          col2 = blendTo(col2, CORE_ABYSS, 0.85 * Math.pow(d, 0.55));

          const heat = this.coreHeat01();
          if (heat > 0.001) {
            const band = d >= 0.82 ? 1.0 : d >= 0.66 ? 0.7 : d >= 0.50 ? 0.4 : 0.0;

            if (band > 0) {
              const tNow = this.scene.time.now;

              const cellHash = ((r * 73856093) ^ (c * 19349663)) >>> 0;
              const n01 = (cellHash % 1000) / 1000;
              const wobble = 0.75 + 0.25 * Math.sin(tNow * 0.006 + n01 * 6.283);
              const k = heat * band * wobble;

              col2 = blendTo(col2, 0x3a0000, 0.55 * k);
              col2 = blendTo(col2, 0xb01800, 0.35 * k);
              col2 = blendTo(col2, 0xff5a1a, 0.25 * k);
              col2 = blendTo(col2, 0xffcc33, 0.10 * k);
            }
          }
          col = col2;
        }
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

  protected override onPointsChanged() {
    if (!this.scene) return;
    const tf = getTerraforming(this.scene);
    const level = Phaser.Math.Clamp(Math.round(this.points), 0, this.thermometerMax);

    if ((tf as any).setCoreLevel) (tf as any).setCoreLevel(level);
    else (tf as any).coreLevel = level;

    this.drawGridLines();

  }
}
