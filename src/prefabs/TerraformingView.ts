import Phaser from "phaser";
import PlanetEdge from "./PlanetEdge";
import { makeRotator } from "../planet/PlanetMath";
import { drawWireGrid } from "../planet/PlanetRenderer";
import { log } from "../utilities/GameUtils";
import MagneticField from "./MagneticField";

export type TerraformingViewConfig = {
  diameter: number;
  offsetRatio: number;
  arcStartDeg: number;
  arcEndDeg: number;
  radiusOffset: number;

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

  protected planetEdge!: PlanetEdge;
  protected grid!: Phaser.GameObjects.Graphics;

  protected sprites: Phaser.GameObjects.Image[] = [];

  protected deviceButtons = new Map<0 | 1 | 2, Phaser.GameObjects.Container>();
  protected backButton?: Phaser.GameObjects.Container;

  protected deviceSlots: (0 | 1 | 2 | null)[] = [];
  protected selectedDevice: 0 | 1 | 2 | null = null;
  protected slotMarkers: Phaser.GameObjects.Container[] = [];

  protected atmospherePoints = 5;

  protected readonly deviceKeys: readonly [string, string, string];
  protected readonly deviceCosts: Record<0 | 1 | 2, number>;
  protected readonly deviceRates: Record<0 | 1 | 2, number>;

  protected pointsTimer?: Phaser.Time.TimerEvent;

  protected thermometerMax = 1000;

  protected thermoBg!: Phaser.GameObjects.Graphics;
  protected thermoFill!: Phaser.GameObjects.Graphics;

  protected thermoLocalX: number;
  protected thermoTopLocalY: number;
  protected thermoH: number;
  protected thermoW: number;

  protected buttonRowLocalY: number;

  protected backButtonLocalX: number;
  protected backButtonLocalY: number;

  protected flipWorldY: boolean;

  protected onBackEvent: string;

  protected magField?: MagneticField;
  protected debugForceFieldMax = true;
  protected behindWorld = new Phaser.GameObjects.Container(this.scene, 0, 0);

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

    this.add(this.world);
    this.add(this.ui);

    this.world.add(this.behindWorld);
    this.magField = new MagneticField(scene, this.behindWorld, {
      r: this.r,
      centerX: 0,
      centerY: this.r * this.offsetRatio,
      lineAlpha: 0.18,
      lineWidth: 2,
      perSideLines: 5,
      loopCenterOffsetMul: 0.62,
      innerRadiusMul: 0.55,
      outerRadiusMul: 1.85,
      strengthOverride01: 1
    });

    this.planetEdge = new PlanetEdge(scene, 0, 0, { diameter: this.diameter, capRatio: this.offsetRatio });
    this.world.add(this.planetEdge);

    this.grid = scene.add.graphics();
    this.world.add(this.grid);

    if (this.flipWorldY) {
      this.world.setScale(1, -1);
    }

    const centerY = this.r * this.offsetRatio;

    this.magField = new MagneticField(scene, this.world, {
      r: this.r,
      centerX: 0,
      centerY,

      lineAlpha: 0.18,
      lineWidth: 2,

      perSideLines: 5,

      loopCenterOffsetMul: 0.62,
      innerRadiusMul: 0.55,
      outerRadiusMul: 1.85,

      strengthOverride01: this.debugForceFieldMax ? 1 : null
    });

    this.drawGridLines();

    this.rebuildSprites();
    this.createDeviceButtons();
    this.createBackButton();

    this.createThermometer();
    this.updateThermometer();

    this.pointsTimer = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.atmospherePoints += this.getPointsPerSecond();
        log(`Points: ${this.atmospherePoints}`);
        this.updateThermometer();
        this.updateDeviceButtonStates();
        this.onPointsChanged();
        const ratio = Phaser.Math.Clamp(this.atmospherePoints / this.thermometerMax, 0, 1);
        this.magField?.setStrength01(ratio);
      }
    });

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.pointsTimer?.remove(false);
    });

    this.updateDeviceButtonStates();
  }

  protected drawGridLines() {
    const centerY = this.r * this.offsetRatio;

    this.grid.setPosition(0, centerY);

    const rotate = makeRotator(0, 0);

    const divisions = 40;
    const samples = 200;
    const lineWidth = 3;
    const lineAlpha = 0.35;

    drawWireGrid(this.grid, this.r, divisions, samples, lineWidth, lineAlpha, rotate);
  }

  protected createThermometer() {
    this.thermoBg = this.scene.add.graphics();
    this.thermoFill = this.scene.add.graphics();

    this.ui.add(this.thermoBg);
    this.ui.add(this.thermoFill);

    this.drawThermometerFrame();
  }

  protected drawThermometerFrame() {
    const x = this.thermoLocalX;
    const y = this.thermoTopLocalY;
    const w = this.thermoW;
    const h = this.thermoH;

    this.thermoBg.clear();

    this.thermoBg.fillStyle(0x11111a, 0.65);
    this.thermoBg.fillRect(x - w / 2, y, w, h);

    this.thermoBg.lineStyle(4, 0xffffff, 0.55);
    this.thermoBg.strokeRect(x - w / 2, y, w, h);
  }

  protected updateThermometer() {
    const ratio = Phaser.Math.Clamp(this.atmospherePoints / this.thermometerMax, 0, 1);

    const x = this.thermoLocalX;
    const y = this.thermoTopLocalY;
    const w = this.thermoW;
    const h = this.thermoH;

    const inset = 4;
    const iw = w - inset * 2;
    const ih = h - inset * 2;

    const fillH = Math.floor(ih * ratio);
    const fillY = y + inset + (ih - fillH);

    this.thermoFill.clear();
    if (fillH <= 0) return;

    this.thermoFill.fillStyle(0xff0000, 0.85);
    this.thermoFill.fillRect(x - iw / 2, fillY, iw, fillH);
  }

  protected getPointsPerSecond() {
    let total = 0;

    for (const slot of this.deviceSlots) {
      if (slot === null) continue;
      total += this.deviceRates[slot];
    }

    return total;
  }

  protected createBackButton() {
    this.backButton?.destroy();

    const size = 120;
    const half = size / 2;

    const btn = this.scene.add.container(this.backButtonLocalX, this.backButtonLocalY);

    const bg = this.scene.add.graphics();

    const draw = (strokeColor: number) => {
      bg.clear();
      bg.fillStyle(0x20202c, 1);
      bg.fillRect(-half, -half, size, size);
      bg.lineStyle(6, strokeColor, 1);
      bg.strokeRect(-half, -half, size, size);
    };

    draw(0x494949);

    const img = this.scene.add.image(0, 0, "planet");
    const pad = 16;
    const max = size - pad * 2;
    const scale = Math.min(max / img.width, max / img.height);
    img.setScale(scale);

    const hit = this.scene.add.zone(0, 0, size, size).setOrigin(0.5, 0.5);
    hit.setInteractive(new Phaser.Geom.Rectangle(0, 0, size, size), Phaser.Geom.Rectangle.Contains);

    hit.on("pointerover", () => {
      this.scene.input.setDefaultCursor("pointer");
      draw(0xffd84d);
      btn.setScale(1.03);
    });

    hit.on("pointerout", () => {
      this.scene.input.setDefaultCursor("default");
      draw(0x494949);
      btn.setScale(1.0);
    });

    hit.on("pointerdown", () => {
      this.scene.events.emit(this.onBackEvent);
    });

    btn.add(bg);
    btn.add(img);
    btn.add(hit);

    this.ui.add(btn);
    this.backButton = btn;
  }

  protected createDeviceButtons() {
    this.deviceButtons.clear();

    const diameter = 200;
    const radius = diameter / 2;

    const xPositions = [-360, 0, 360];

    for (let i = 0; i < 3; i++) {
      const device = i as 0 | 1 | 2;

      const btn = this.makeCircleImageButton(
        xPositions[i],
        this.buttonRowLocalY,
        radius,
        this.deviceKeys[i],
        device
      );

      this.ui.add(btn);
      this.deviceButtons.set(device, btn);
    }
  }

  protected drawButtonGlow(g: Phaser.GameObjects.Graphics, radius: number, color = 0x9fd6ff) {
    g.clear();

    const layers = 18;
    const inner = radius * 1.02;
    const outer = radius * 1.20;

    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1);
      const rad = Phaser.Math.Linear(inner, outer, t);
      const a = 0.22 * Math.pow(1 - t, 2.0);

      g.lineStyle(10, color, a);
      g.strokeCircle(0, 0, rad);
    }
  }

  protected makeCircleImageButton(localX: number, localY: number, radius: number, imageKey: string, deviceIndex: 0 | 1 | 2) {
    const btn = this.scene.add.container(localX, localY);

    const bg = this.scene.add.graphics();

    const draw = (strokeColor: number) => {
      bg.clear();
      bg.fillStyle(0x20202c, 1);
      bg.fillCircle(0, 0, radius);
      bg.lineStyle(6, strokeColor, 1);
      bg.strokeCircle(0, 0, radius);
    };

    draw(0x494949);

    const glow = this.scene.add.graphics();
    this.drawButtonGlow(glow, radius);

    const img = this.scene.add.image(0, 0, imageKey);

    const pad = 28;
    const max = radius * 2 - pad * 2;
    const scale = Math.min(max / img.width, max / img.height);
    img.setScale(scale);

    const diameter = radius * 2;
    const hit = this.scene.add.zone(0, 0, diameter, diameter).setOrigin(0.5, 0.5);
    hit.setInteractive(new Phaser.Geom.Circle(radius, radius, radius), Phaser.Geom.Circle.Contains);

    hit.on("pointerover", () => {
      if (!hit.input?.enabled) return;
      this.scene.input.setDefaultCursor("pointer");
      draw(0xffd84d);
      btn.setScale(1.03);
    });

    hit.on("pointerout", () => {
      this.scene.input.setDefaultCursor("default");
      draw(0x494949);
      btn.setScale(1.0);
    });

    hit.on("pointerdown", () => {
      if (!hit.input?.enabled) return;
      this.selectDevice(deviceIndex);
    });

    btn.add(glow);
    btn.add(bg);
    btn.add(img);
    btn.add(hit);

    return btn;
  }

  protected selectDevice(device: 0 | 1 | 2) {
    const cost = this.deviceCosts[device];
    if (this.atmospherePoints < cost) return;

    if (this.selectedDevice === device) {
      this.selectedDevice = null;
      this.clearSlotMarkers();
      this.updateDeviceButtonStates();
      return;
    }

    this.selectedDevice = device;
    this.showEmptySlotMarkers();
    this.updateDeviceButtonStates();
  }

  protected clearSlotMarkers() {
    for (const m of this.slotMarkers) {
      m.destroy();
    }
    this.slotMarkers = [];
  }

  protected showEmptySlotMarkers() {
    this.clearSlotMarkers();

    if (this.selectedDevice === null) return;

    const localCenterX = 0;
    const localCenterY = this.r * this.offsetRatio;

    const arcStart = Phaser.Math.DegToRad(this.arcStartDeg);
    const arcEnd = Phaser.Math.DegToRad(this.arcEndDeg);

    const radius = this.r + this.radiusOffset - 20;

    for (let i = 0; i < this.atmoCount; i++) {
      if (this.deviceSlots[i] !== null) continue;

      const t = this.atmoCount === 1 ? 0.5 : i / (this.atmoCount - 1);
      const ang = Phaser.Math.Linear(arcStart, arcEnd, t);

      const x = localCenterX + Math.cos(ang) * radius;
      let y = localCenterY + Math.sin(ang) * radius;

      if (this.flipWorldY) {
        y *= -1;
        y += 1360;
      }

      log(`Show marker at slot ${i} (${x.toFixed(1)}, ${y.toFixed(1)})`);

      const marker = this.makeEmptySlotMarker(x, y, i);

      this.world.add(marker);
      this.slotMarkers.push(marker);
    }
  }

  protected makeEmptySlotMarker(x: number, y: number, slotIndex: number) {
    const c = this.scene.add.container(x, y);

    const dot = this.scene.add.graphics();
    dot.lineStyle(4, 0xffff00, 0.85);
    dot.strokeCircle(0, 0, 16);

    const hitRadius = 26;
    const hit = this.scene.add.zone(0, 0, hitRadius * 2, hitRadius * 2).setOrigin(0.5, 0.5);
    hit.setInteractive(new Phaser.Geom.Circle(hitRadius, hitRadius, hitRadius), Phaser.Geom.Circle.Contains);

    hit.on("pointerover", () => {
      this.scene.input.setDefaultCursor("pointer");
      dot.clear();
      dot.lineStyle(5, 0xffd84d, 1);
      dot.strokeCircle(0, 0, 18);
    });

    hit.on("pointerout", () => {
      this.scene.input.setDefaultCursor("default");
      dot.clear();
      dot.lineStyle(4, 0xffff00, 0.85);
      dot.strokeCircle(0, 0, 16);
    });

    hit.on("pointerdown", () => {
      this.placeSelectedDevice(slotIndex);
    });

    c.add(dot);
    c.add(hit);

    return c;
  }

  protected placeSelectedDevice(slotIndex: number) {
    if (this.selectedDevice === null) return;
    if (this.deviceSlots[slotIndex] !== null) return;

    const cost = this.deviceCosts[this.selectedDevice];
    if (this.atmospherePoints < cost) return;

    this.atmospherePoints -= cost;
    this.deviceSlots[slotIndex] = this.selectedDevice;

    this.rebuildSprites();

    this.selectedDevice = null;
    this.clearSlotMarkers();

    this.updateThermometer();
    this.updateDeviceButtonStates();
  }

  public rebuildSprites() {
    for (const s of this.sprites) {
      s.destroy();
    }
    this.sprites = [];

    const localCenterX = 0;
    const localCenterY = this.r * this.offsetRatio;

    const arcStart = Phaser.Math.DegToRad(this.arcStartDeg);
    const arcEnd = Phaser.Math.DegToRad(this.arcEndDeg);

    const radius = this.r + this.radiusOffset;

    for (let i = 0; i < this.atmoCount; i++) {
      const slot = this.deviceSlots[i];
      if (slot === null) continue;

      const t = this.atmoCount === 1 ? 0.5 : i / (this.atmoCount - 1);
      const ang = Phaser.Math.Linear(arcStart, arcEnd, t);

      const key = this.deviceKeys[slot];
      const x = localCenterX + Math.cos(ang) * radius;
      let y = localCenterY + Math.sin(ang) * radius;

      if (this.flipWorldY) {
        y *= -1;
        y += 1360;
      }

      const img = this.scene.add.image(x, y, key);
      let rotation = ang + Math.PI / 2;
      if(this.flipWorldY) {
        rotation = -rotation;
      }
      img.setRotation(rotation);

      if(this.flipWorldY) {
        img.setScale(1, -1);
      }

      this.world.add(img);
      this.sprites.push(img);
    }
  }

  protected onPointsChanged() {}


  protected updateDeviceButtonStates() {
    for (const [device, btn] of this.deviceButtons) {
      const cost = this.deviceCosts[device];
      const affordable = this.atmospherePoints >= cost;

      btn.setAlpha(affordable ? 1 : 0.4);

      const hit = btn.list[btn.list.length - 1] as Phaser.GameObjects.Zone;

      if (affordable) {
        hit.setInteractive(new Phaser.Geom.Circle(100, 100, 100), Phaser.Geom.Circle.Contains);
      } else {
        hit.disableInteractive();
        if (this.selectedDevice === device) {
          this.selectedDevice = null;
          this.clearSlotMarkers();
        }
      }
    }
  }
}
