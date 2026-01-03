import Phaser from "phaser";
import PlanetEdge from "./PlanetEdge";
import MagneticField from "./MagneticField";
import { makeRotator } from "../../planet/PlanetMath";
import { drawWireGrid } from "../../planet/PlanetRenderer";
import { log } from "../../utilities/GameUtils";

import TerraformProgress from "./TerraformProgress";
import PlanetButton from "./PlanetButton";
import DeviceButtons from "./DevicePalette";
import DeviceSlots from "./DeviceSlots";

export type TerraformingViewConfig = {
  diameter: number;
  offsetRatio: number;
  arcStartDeg: number;
  arcEndDeg: number;
  radiusOffset: number;

  worldCenterLocalY?: number;
  renderPlanetEdge?: boolean;

  buttonRowLocalY: number;
  backButtonLocalX: number;
  backButtonLocalY: number;

  thermoLocalX: number;
  thermoTopLocalY: number;
  thermoH: number;
  thermoW: number;

  flipWorldY?: boolean;

  deviceKeys: readonly [string, string, string];
  deviceCosts: Record<0 | 1 | 2, number>;
  deviceRates: Record<0 | 1 | 2, number>;

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

  protected atmospherePoints = 5;
  protected thermometerMax = 1000;

  protected readonly deviceKeys: readonly [string, string, string];
  protected readonly deviceCosts: Record<0 | 1 | 2, number>;
  protected readonly deviceRates: Record<0 | 1 | 2, number>;

  protected pointsTimer?: Phaser.Time.TimerEvent;

  protected thermoLocalX: number;
  protected thermoTopLocalY: number;
  protected thermoH: number;
  protected thermoW: number;

  protected buttonRowLocalY: number;

  protected backButtonLocalX: number;
  protected backButtonLocalY: number;

  protected flipWorldY: boolean;
  protected onBackEvent: string;

  protected worldCenterLocalY: number;
  protected renderPlanetEdge: boolean;

  protected magField?: MagneticField;
  protected debugForceFieldMax = true;

  protected thermometer!: TerraformProgress;
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
    this.atmoCount = 20;

    this.deviceSlots = Array(this.atmoCount).fill(null);

    this.deviceKeys = cfg.deviceKeys;
    this.deviceCosts = cfg.deviceCosts;
    this.deviceRates = cfg.deviceRates;

    this.buttonRowLocalY = cfg.buttonRowLocalY;

    this.thermoLocalX = cfg.thermoLocalX;
    this.thermoTopLocalY = cfg.thermoTopLocalY;
    this.thermoH = cfg.thermoH;
    this.thermoW = cfg.thermoW;

    this.backButtonLocalX = cfg.backButtonLocalX;
    this.backButtonLocalY = cfg.backButtonLocalY;

    this.flipWorldY = cfg.flipWorldY === true;
    this.onBackEvent = cfg.onBackEvent;

    this.worldCenterLocalY = cfg.worldCenterLocalY ?? (this.r * this.offsetRatio);
    this.renderPlanetEdge = cfg.renderPlanetEdge !== false;

    this.add(this.world);
    this.add(this.ui);

    this.world.add(this.behindWorld);

    if (this.renderPlanetEdge) {
      this.planetEdge = new PlanetEdge(scene, 0, 0, { diameter: this.diameter, capRatio: this.offsetRatio });
      this.world.add(this.planetEdge);
    }

    this.grid = scene.add.graphics();
    this.world.add(this.grid);

    if (this.flipWorldY) {
      this.world.setScale(1, -1);
    }

    this.magField = new MagneticField(scene, this.behindWorld, {
      r: this.r,
      centerX: 0,
      centerY: this.worldCenterLocalY,

      lineAlpha: 0.18,
      lineWidth: 2,

      perSideLines: 5,

      loopCenterOffsetMul: 0.62,
      innerRadiusMul: 0.55,
      outerRadiusMul: 1.85,

      strengthOverride01: this.debugForceFieldMax ? 1 : null
    });

    this.drawGridLines();

    this.placement = new DeviceSlots({
      scene: this.scene,
      world: this.world,

      atmoCount: this.atmoCount,
      arcStartDeg: this.arcStartDeg,
      arcEndDeg: this.arcEndDeg,

      radius: () => this.r + this.radiusOffset,

      flipWorldY: this.flipWorldY,
      worldCenterLocalY: () => this.worldCenterLocalY,

      deviceKeys: this.deviceKeys,

      getSlots: () => this.deviceSlots,
      onPlace: (slotIndex: number) => this.placeSelectedDevice(slotIndex)
    });

    this.placement.rebuildSprites();

    this.palette = new DeviceButtons(this.scene, this.ui, {
      y: this.buttonRowLocalY,
      imageKeys: this.deviceKeys,
      costs: this.deviceCosts,
      getPoints: () => this.atmospherePoints,
      onSelect: (d) => this.selectDevice(d)
    });

    this.backBtn = new PlanetButton(this.scene, this.ui, {
      x: this.backButtonLocalX,
      y: this.backButtonLocalY,
      onClick: () => this.scene.events.emit(this.onBackEvent)
    });

    this.thermometer = new TerraformProgress(this.scene, this.ui, {
      x: this.thermoLocalX,
      topY: this.thermoTopLocalY,
      w: this.thermoW,
      h: this.thermoH,
      max: this.thermometerMax
    });

    this.thermometer.setValue(this.atmospherePoints);
    this.palette.updateEnabled();
    this.updateMagFieldStrength();

    this.pointsTimer = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.atmospherePoints += this.getPointsPerSecond();
        log(`Points: ${this.atmospherePoints}`);

        this.thermometer.setValue(this.atmospherePoints);
        this.palette.updateEnabled();

        this.onPointsChanged();
        this.updateMagFieldStrength();
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
    if (this.atmospherePoints < cost) return;

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
    if (this.atmospherePoints < cost) return;

    this.atmospherePoints -= cost;
    this.deviceSlots[slotIndex] = this.selectedDevice;

    this.placement.rebuildSprites();

    this.selectedDevice = null;
    this.placement.clearMarkers();

    this.thermometer.setValue(this.atmospherePoints);
    this.palette.updateEnabled();
    this.updateMagFieldStrength();
  }

  protected updateMagFieldStrength() {
    const ratio = Phaser.Math.Clamp(this.atmospherePoints / this.thermometerMax, 0, 1);
    this.magField?.setStrength01(ratio);
  }

  protected onPointsChanged() {}
}
