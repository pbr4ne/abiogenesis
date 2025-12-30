import Phaser from "phaser";
import PlanetEdge from "./PlanetEdge";
import { log } from "../utilities/GameUtils";

type AtmosphereConfig = {
  diameter: number;
  offsetRatio: number;
  arcStartDeg: number;
  arcEndDeg: number;
  radiusOffset: number;
};

export default class Atmosphere extends Phaser.GameObjects.Container {
  private diameter: number;
  private r: number;
  private offsetRatio: number;

  private atmoCount: number;
  private arcStartDeg: number;
  private arcEndDeg: number;
  private radiusOffset: number;

  private planetEdge!: PlanetEdge;
  private sprites: Phaser.GameObjects.Image[] = [];
  private deviceButtons = new Map<0 | 1 | 2, Phaser.GameObjects.Container>();

  private deviceSlots: (0 | 1 | 2 | null)[] = [];
  private deviceKeys = ["atmosphereDevice1", "atmosphereDevice2", "atmosphereDevice3"] as const;
  private selectedDevice: 0 | 1 | 2 | null = null;
  private slotMarkers: Phaser.GameObjects.Container[] = [];

  private atmospherePoints = 5;

  private readonly deviceCosts: Record<0 | 1 | 2, number> = {
    0: 5,
    1: 20,
    2: 100
  };

  private readonly deviceRates: Record<0 | 1 | 2, number> = {
    0: 1,
    1: 5,
    2: 10
  };

  private pointsTimer?: Phaser.Time.TimerEvent;

  private thermometerMax = 1000;

  private thermoBg!: Phaser.GameObjects.Graphics;
  private thermoFill!: Phaser.GameObjects.Graphics;

  private thermoX = -820;
  private thermoTopY = -1000;
  private thermoH = 700;
  private thermoW = 60;

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: AtmosphereConfig) {
    super(scene, x, y);

    this.diameter = cfg.diameter;
    this.r = this.diameter / 2;
    this.offsetRatio = Phaser.Math.Clamp(cfg.offsetRatio, 0.25, 0.95);

    this.arcStartDeg = cfg.arcStartDeg;
    this.arcEndDeg = cfg.arcEndDeg;

    this.radiusOffset = cfg.radiusOffset;
    this.atmoCount = 20;
    this.deviceSlots = this.deviceSlots = Array(this.atmoCount).fill(null);

    this.planetEdge = new PlanetEdge(scene, 0, 0, { diameter: this.diameter, capRatio: this.offsetRatio });
    this.add(this.planetEdge);

    this.rebuildSprites();
    this.createDeviceButtons(x);

    this.createThermometer();
    this.updateThermometer();

    this.pointsTimer = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.atmospherePoints += this.getAtmospherePerSecond();
        log(`Atmosphere points: ${this.atmospherePoints}`);
        this.updateThermometer();
        this.updateDeviceButtonStates();
      }
    });

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.pointsTimer?.remove(false);
    });

    this.updateDeviceButtonStates();
  }

  private createThermometer() {
    this.thermoBg = this.scene.add.graphics();
    this.thermoFill = this.scene.add.graphics();

    this.add(this.thermoBg);
    this.add(this.thermoFill);

    this.drawThermometerFrame();
  }

  private drawThermometerFrame() {
    const x = this.thermoX;
    const y = this.thermoTopY;
    const w = this.thermoW;
    const h = this.thermoH;

    this.thermoBg.clear();

    this.thermoBg.fillStyle(0x11111a, 0.65);
    this.thermoBg.fillRect(x - w / 2, y, w, h);

    this.thermoBg.lineStyle(4, 0xffffff, 0.55);
    this.thermoBg.strokeRect(x - w / 2, y, w, h);
  }

  private updateThermometer() {
    const ratio = Phaser.Math.Clamp(
      this.atmospherePoints / this.thermometerMax,
      0,
      1
    );

    const x = this.thermoX;
    const y = this.thermoTopY;
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

  private getAtmospherePerSecond() {
    let total = 0;

    for (const slot of this.deviceSlots) {
      if (slot === null) continue;
      total += this.deviceRates[slot];
    }

    return total;
  }

  private createDeviceButtons(x: number) {

    const keys = ["atmosphereDevice1", "atmosphereDevice2", "atmosphereDevice3"];

    const diameter = 200;
    const radius = diameter / 2;
    const y = 240;

    const xPositions = [x - 360, x, x + 360];

    this.deviceButtons.clear();

    for (let i = 0; i < 3; i++) {
      const device = i as 0 | 1 | 2;
      const btn = this.makeCircleImageButton(
        xPositions[i] - this.x,
        y - this.y,
        radius,
        keys[i],
        device
      );

      this.add(btn);
      this.deviceButtons.set(device, btn);
    }
  }

  private drawButtonGlow = (
    g: Phaser.GameObjects.Graphics,
    radius: number,
    color = 0x9fd6ff
  ) => {
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
  };

  private makeCircleImageButton(
    localX: number,
    localY: number,
    radius: number,
    imageKey: string,
    deviceIndex: 0 | 1 | 2
  ) {
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
    hit.setInteractive(
      new Phaser.Geom.Circle(radius, radius, radius),
      Phaser.Geom.Circle.Contains
    );

    hit.on("pointerover", () => {
      this.scene.input.setDefaultCursor("pointer");
      draw(0x00ff00);
      btn.setScale(1.03);
    });

    hit.on("pointerout", () => {
      this.scene.input.setDefaultCursor("default");
      draw(0x494949);
      btn.setScale(1.0);
    });

    hit.on("pointerdown", () => {
      this.selectDevice(deviceIndex);
    });

    btn.add(glow);
    btn.add(bg);
    btn.add(img);
    btn.add(hit);

    return btn;
  }

  private selectDevice(device: 0 | 1 | 2) {
    if (this.selectedDevice === device) {
      this.selectedDevice = null;
      this.clearSlotMarkers();
      return;
    }

    this.selectedDevice = device;
    this.showEmptySlotMarkers();
    this.updateDeviceButtonStates();
  }

  private clearSlotMarkers() {
    for (const m of this.slotMarkers) {
      m.destroy();
    }
    this.slotMarkers = [];
  }

  private showEmptySlotMarkers() {
    this.clearSlotMarkers();

    if (this.selectedDevice === null) {
      return;
    }

    const localCenterX = 0;
    const localCenterY = this.r * this.offsetRatio;

    const arcStart = Phaser.Math.DegToRad(this.arcStartDeg);
    const arcEnd = Phaser.Math.DegToRad(this.arcEndDeg);

    const radius = this.r + this.radiusOffset-20;

    for (let i = 0; i < this.atmoCount; i++) {
      if (this.deviceSlots[i] !== null) continue;

      const t = this.atmoCount === 1 ? 0.5 : i / (this.atmoCount - 1);
      const ang = Phaser.Math.Linear(arcStart, arcEnd, t);

      const x = localCenterX + Math.cos(ang) * radius;
      const y = localCenterY + Math.sin(ang) * radius;

      const marker = this.makeEmptySlotMarker(x, y, i);
      this.add(marker);
      this.slotMarkers.push(marker);
    }
  }

  private makeEmptySlotMarker(x: number, y: number, slotIndex: number) {
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

  private placeSelectedDevice(slotIndex: number) {
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

      if (slot === null) {
        continue;
      }

      const t = this.atmoCount === 1 ? 0.5 : i / (this.atmoCount - 1);
      const ang = Phaser.Math.Linear(arcStart, arcEnd, t);

      const x = localCenterX + Math.cos(ang) * radius;
      const y = localCenterY + Math.sin(ang) * radius;

      const key = this.deviceKeys[slot];
      const img = this.scene.add.image(x, y, key);
      img.setRotation(ang + Math.PI / 2);

      this.add(img);
      this.sprites.push(img);
    }
  }

  private updateDeviceButtonStates() {
    for (const [device, btn] of this.deviceButtons) {
      const cost = this.deviceCosts[device];
      const affordable = this.atmospherePoints >= cost;

      btn.setAlpha(affordable ? 1 : 0.4);

      const hit = btn.list[btn.list.length - 1] as Phaser.GameObjects.Zone;

      if (affordable) {
        hit.setInteractive();
      } else {
        hit.disableInteractive();
      }
    }
  }
}
