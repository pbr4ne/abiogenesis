import Phaser from "phaser";

type DeviceSlotsCfg = {
  scene: Phaser.Scene;
  world: Phaser.GameObjects.Container;

  atmoCount: number;
  arcStartDeg: number;
  arcEndDeg: number;

  radius: () => number;

  flipWorldY: boolean;
  worldCenterLocalY: () => number;

  deviceKeys: readonly [string, string, string];

  getSlots: () => (0 | 1 | 2 | null)[];
  onPlace: (slotIndex: number) => void;
};

export default class DeviceSlots {
  private scene: Phaser.Scene;
  private world: Phaser.GameObjects.Container;

  private atmoCount: number;
  private arcStartDeg: number;
  private arcEndDeg: number;

  private radiusFn: () => number;

  private flipWorldY: boolean;
  private worldCenterLocalYFn: () => number;

  private deviceKeys: readonly [string, string, string];

  private getSlots: () => (0 | 1 | 2 | null)[];
  private onPlace: (slotIndex: number) => void;

  private slotMarkers: Phaser.GameObjects.Container[] = [];
  private sprites: Phaser.GameObjects.Image[] = [];

  constructor(cfg: DeviceSlotsCfg) {
    this.scene = cfg.scene;
    this.world = cfg.world;

    this.atmoCount = cfg.atmoCount;
    this.arcStartDeg = cfg.arcStartDeg;
    this.arcEndDeg = cfg.arcEndDeg;

    this.radiusFn = cfg.radius;

    this.flipWorldY = cfg.flipWorldY;
    this.worldCenterLocalYFn = cfg.worldCenterLocalY;

    this.deviceKeys = cfg.deviceKeys;

    this.getSlots = cfg.getSlots;
    this.onPlace = cfg.onPlace;
  }

  public clearMarkers() {
    for (const m of this.slotMarkers) m.destroy();
    this.slotMarkers = [];
  }

  public showEmptySlotMarkers() {
    this.clearMarkers();

    const slots = this.getSlots();

    const localCenterX = 0;
    const localCenterY = this.worldCenterLocalYFn();

    const arcStart = Phaser.Math.DegToRad(this.arcStartDeg);
    const arcEnd = Phaser.Math.DegToRad(this.arcEndDeg);

    const radius = this.radiusFn();

    for (let i = 0; i < this.atmoCount; i++) {
      if (slots[i] !== null) continue;

      const t = this.atmoCount === 1 ? 0.5 : i / (this.atmoCount - 1);
      const ang = Phaser.Math.Linear(arcStart, arcEnd, t);

      const x = localCenterX + Math.cos(ang) * radius;
      let y = localCenterY + Math.sin(ang) * radius;

      if (this.flipWorldY) {
        y *= -1;
        y += 1360;
      }

      const marker = this.makeEmptySlotMarker(x, y, i);
      this.world.add(marker);
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

    hit.on("pointerdown", () => this.onPlace(slotIndex));

    c.add(dot);
    c.add(hit);

    return c;
  }

  public rebuildSprites() {
    for (const s of this.sprites) s.destroy();
    this.sprites = [];

    const slots = this.getSlots();

    const localCenterX = 0;
    const localCenterY = this.worldCenterLocalYFn();

    const arcStart = Phaser.Math.DegToRad(this.arcStartDeg);
    const arcEnd = Phaser.Math.DegToRad(this.arcEndDeg);

    const radius = this.radiusFn();

    for (let i = 0; i < this.atmoCount; i++) {
      const slot = slots[i];
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
      if (this.flipWorldY) rotation = -rotation;
      img.setRotation(rotation);

      if (this.flipWorldY) img.setScale(1, -1);

      this.world.add(img);
      this.sprites.push(img);
    }
  }

  public destroy() {
    this.clearMarkers();
    for (const s of this.sprites) s.destroy();
    this.sprites = [];
  }
}
