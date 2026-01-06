import Phaser from "phaser";
import PlanetEdge from "./PlanetEdge";
import { makeRotator } from "../../planet/PlanetMath";
import { drawWireGrid } from "../../planet/PlanetRenderer";
import { log } from "../../utilities/GameUtils";

import TerraformingProgress from "./TerraformingProgress";
import PlanetButton from "./PlanetButton";
import DeviceButtons from "./DevicePalette";
import DeviceSlots from "./DeviceSlots";
import PlanetRunState from "../../planet/PlanetRunState";

export type DeviceButtonTheme = {
  stroke: readonly [number, number, number];
  glow: readonly [number, number, number];
  bgFill?: number;
  idleStrokeFallback?: number;
  hoverStrokeMul?: number;
};

export type TerraformingViewConfig = {
  diameter: number;
  offsetRatio: number;
  arcStartDeg: number;
  arcEndDeg: number;
  radiusOffset: number;

  worldCenterLocalY?: number;
  renderPlanetEdge?: boolean;

  slotCount?: number;

  buttonRowLocalY?: number;

  buttonLayout?: "row" | "col";
  buttonLocalX?: number;
  buttonTopLocalY?: number;

  backButtonLocalX: number;
  backButtonLocalY: number;

  thermoLocalX: number;
  thermoTopLocalY: number;
  thermoH: number;
  thermoW: number;
  thermoColour: number;
  thermoOrientation?: "vertical" | "horizontal";

  flipWorldY?: boolean;

  deviceKeys: readonly [string, string, string];
  deviceCosts: Record<0 | 1 | 2, number>;
  deviceRates: Record<0 | 1 | 2, number>;

  deviceButtonTheme?: DeviceButtonTheme;

  onBackEvent: string;
};

export default class TerraformingView extends Phaser.GameObjects.Container {
  protected diameter: number;
  protected r: number;
  protected offsetRatio: number;

  protected atmoCount: number;
  protected arcStartDeg: number;
  protected arcEndDeg: number;
  protected radiusOffset: number;

  protected world = new Phaser.GameObjects.Container(this.scene, 0, 0);
  protected ui = new Phaser.GameObjects.Container(this.scene, 0, 0);
  protected behindWorld = new Phaser.GameObjects.Container(this.scene, 0, 0);

  protected planetEdge?: PlanetEdge;
  protected grid!: Phaser.GameObjects.Graphics;

  protected deviceSlots: (0 | 1 | 2 | null)[] = [];
  protected selectedDevice: 0 | 1 | 2 | null = null;

  protected points = 5;
  protected thermometerMax = 1000;

  protected readonly deviceKeys: readonly [string, string, string];
  protected readonly deviceCosts: Record<0 | 1 | 2, number>;
  protected readonly deviceRates: Record<0 | 1 | 2, number>;

  protected readonly deviceButtonTheme?: DeviceButtonTheme;

  protected pointsTimer?: Phaser.Time.TimerEvent;

  protected thermoLocalX: number;
  protected thermoTopLocalY: number;
  protected thermoH: number;
  protected thermoW: number;
  protected thermoColour: number;
  protected thermoOrientation: "vertical" | "horizontal";

  protected buttonRowLocalY: number;
  protected buttonLayout: "row" | "col";
  protected buttonLocalX: number;
  protected buttonTopLocalY: number;

  protected backButtonLocalX: number;
  protected backButtonLocalY: number;

  protected flipWorldY: boolean;
  protected onBackEvent: string;

  protected worldCenterLocalY: number;
  protected renderPlanetEdge: boolean;

  protected thermometer!: TerraformingProgress;
  protected backBtn?: PlanetButton;
  protected palette!: DeviceButtons;
  protected placement!: DeviceSlots;

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: TerraformingViewConfig) {
    super(scene, x, y);

    this.diameter = cfg.diameter;
    this.r = this.diameter / 2;
    this.offsetRatio = Phaser.Math.Clamp(cfg.offsetRatio, 0.25, 0.95);

    this.arcStartDeg = cfg.arcStartDeg;
    this.arcEndDeg = cfg.arcEndDeg;

    this.radiusOffset = cfg.radiusOffset;

    this.atmoCount = cfg.slotCount ?? 20;
    this.deviceSlots = Array(this.atmoCount).fill(null);

    this.deviceKeys = cfg.deviceKeys;
    this.deviceCosts = cfg.deviceCosts;
    this.deviceRates = cfg.deviceRates;

    this.deviceButtonTheme = cfg.deviceButtonTheme;

    this.buttonRowLocalY = cfg.buttonRowLocalY ?? (1080 - 240 - y);
    this.buttonLayout = cfg.buttonLayout ?? "row";
    this.buttonLocalX = cfg.buttonLocalX ?? -850;
    this.buttonTopLocalY = cfg.buttonTopLocalY ?? 260;

    this.thermoLocalX = cfg.thermoLocalX;
    this.thermoTopLocalY = cfg.thermoTopLocalY;
    this.thermoH = cfg.thermoH;
    this.thermoW = cfg.thermoW;
    this.thermoColour = cfg.thermoColour;
    this.thermoOrientation = cfg.thermoOrientation ?? "vertical";

    this.backButtonLocalX = cfg.backButtonLocalX;
    this.backButtonLocalY = cfg.backButtonLocalY;

    this.flipWorldY = cfg.flipWorldY === true;
    this.onBackEvent = cfg.onBackEvent;

    this.worldCenterLocalY = cfg.worldCenterLocalY ?? (this.r * this.offsetRatio);
    this.renderPlanetEdge = cfg.renderPlanetEdge !== false;

    this.add(this.world);
    this.add(this.ui);

    this.world.add(this.behindWorld);

    this.grid = scene.add.graphics();
    this.world.add(this.grid);

    if (this.renderPlanetEdge) {
      const run = scene.registry.get("run") as PlanetRunState;

      this.planetEdge = new PlanetEdge(scene, 0, 0, {
        diameter: this.diameter,
        capRatio: this.offsetRatio,
        run
      });

      this.world.add(this.planetEdge);
    }

    if (this.flipWorldY) {
      this.world.setScale(1, -1);
    }

    this.createBehindWorldOverlays();

    this.drawGridLines();

    this.placement = new DeviceSlots({
      scene: this.scene,
      world: this.world,

      slotCount: this.atmoCount,
      deviceKeys: this.deviceKeys,
      deviceColors: this.deviceButtonTheme?.stroke ?? [0xffffff, 0xffffff, 0xffffff],

      getSlots: () => this.deviceSlots,
      getSlotTransform: (i) => this.getSlotTransform(i),

      getCellSize: () => this.getSlotCellSize(),

      onPlace: (i) => this.placeSelectedDevice(i)
    });

    this.placement.rebuildSprites();

    if (this.buttonLayout === "col") {
      this.palette = new DeviceButtons(this.scene, this.ui, {
        layout: "col",
        x: this.buttonLocalX,
        topY: this.buttonTopLocalY,
        imageKeys: this.deviceKeys,
        costs: this.deviceCosts,
        getPoints: () => this.points,
        onSelect: (d: 0 | 1 | 2) => this.selectDevice(d),
        theme: this.deviceButtonTheme
      });
    } else {
      this.palette = new DeviceButtons(this.scene, this.ui, {
        layout: "row",
        y: this.buttonRowLocalY,
        imageKeys: this.deviceKeys,
        costs: this.deviceCosts,
        getPoints: () => this.points,
        onSelect: (d: 0 | 1 | 2) => this.selectDevice(d),
        theme: this.deviceButtonTheme
      });
    }

    this.backBtn = new PlanetButton(this.scene, this.ui, {
      x: this.backButtonLocalX,
      y: this.backButtonLocalY,
      onClick: () => this.scene.events.emit(this.onBackEvent)
    });

    this.thermometer = new TerraformingProgress(this.scene, this.ui, {
      orientation: this.thermoOrientation,
      x: this.thermoLocalX,
      topY: this.thermoTopLocalY,
      w: this.thermoW,
      h: this.thermoH,
      max: this.thermometerMax,
      colour: this.thermoColour,
    });

    this.thermometer.setValue(this.points);
    this.palette.updateEnabled();

    this.pointsTimer = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.points = Math.min(this.thermometerMax, this.points + this.getPointsPerSecond());

        log(`Points: ${this.points}`);

        this.thermometer.setValue(this.points);
        this.palette.updateEnabled();

        this.onPointsChanged();
        this.onTick();
      }
    });

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.pointsTimer?.remove(false);
      this.thermometer?.destroy();
      this.backBtn?.destroy();
      this.palette?.destroy();
      this.placement?.destroy();
    });
  }

  protected getSlotTransform(slotIndex: number) {
    const localCenterX = 0;
    const localCenterY = this.worldCenterLocalY;

    const arcStart = Phaser.Math.DegToRad(this.arcStartDeg);
    const arcEnd = Phaser.Math.DegToRad(this.arcEndDeg);

    const radius = this.r + this.radiusOffset;

    const t = this.atmoCount === 1 ? 0.5 : slotIndex / (this.atmoCount - 1);
    const ang = Phaser.Math.Linear(arcStart, arcEnd, t);

    const x = localCenterX + Math.cos(ang) * radius;
    let y = localCenterY + Math.sin(ang) * radius;

    let rotation = ang + Math.PI / 2;

    if (this.flipWorldY) {
      y *= -1;
      y += 1360;
      rotation = -rotation;
    }

    return { x, y, rotation };
  }

  protected drawGridLines() {
    this.grid.clear();
    this.grid.setPosition(0, this.worldCenterLocalY);

    const rotate = makeRotator(0, 0);

    const divisions = 40;
    const samples = 200;
    const lineWidth = 3;
    const lineAlpha = 0.35;

    drawWireGrid(this.grid, this.r, divisions, samples, lineWidth, lineAlpha, rotate);
  }

  protected getPointsPerSecond() {
    let total = 0;

    for (const slot of this.deviceSlots) {
      if (slot === null) continue;
      total += this.deviceRates[slot];
    }

    return total;
  }

  protected selectDevice(device: 0 | 1 | 2) {
    const cost = this.deviceCosts[device];
    if (this.points < cost) return;

    if (this.selectedDevice === device) {
      this.selectedDevice = null;
      this.placement.clearMarkers();
      this.palette.updateEnabled();
      return;
    }

    this.selectedDevice = device;
    this.placement.showEmptySlotMarkers();
    this.palette.updateEnabled();
  }

  protected placeSelectedDevice(slotIndex: number) {
    if (this.selectedDevice === null) return;
    if (this.deviceSlots[slotIndex] !== null) return;

    const cost = this.deviceCosts[this.selectedDevice];
    if (this.points < cost) return;

    this.points -= cost;
    this.deviceSlots[slotIndex] = this.selectedDevice;

    this.placement.rebuildSprites();

    this.selectedDevice = null;
    this.placement.clearMarkers();

    this.thermometer.setValue(this.points);
    this.palette.updateEnabled();

    this.onTick();
  }

  protected createBehindWorldOverlays() { }

  protected onTick() { }

  protected onPointsChanged() { }

  protected getSlotCellSize(): number {
    return 100;
  }
}
