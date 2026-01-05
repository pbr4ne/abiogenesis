import Phaser from "phaser";

type SlotTransform = {
  x: number;
  y: number;
  rotation: number;
};

type DeviceSlotsCfg = {
  scene: Phaser.Scene;
  world: Phaser.GameObjects.Container;

  slotCount: number;

  deviceKeys: readonly [string, string, string];

  getSlots: () => (0 | 1 | 2 | null)[];
  getSlotTransform: (slotIndex: number) => SlotTransform;

  onPlace: (slotIndex: number) => void;

  getCellSize: () => number;
};

export default class DeviceSlots {
  private scene: Phaser.Scene;
  private world: Phaser.GameObjects.Container;

  private slotCount: number;

  private deviceKeys: readonly [string, string, string];

  private getSlots: () => (0 | 1 | 2 | null)[];
  private getSlotTransform: (slotIndex: number) => SlotTransform;

  private onPlace: (slotIndex: number) => void;

  private slotMarkers: Phaser.GameObjects.Container[] = [];
  private sprites: Phaser.GameObjects.Image[] = [];

  private getCellSize: () => number;

  constructor(cfg: DeviceSlotsCfg) {
    this.scene = cfg.scene;
    this.world = cfg.world;

    this.slotCount = cfg.slotCount;

    this.deviceKeys = cfg.deviceKeys;

    this.getSlots = cfg.getSlots;
    this.getSlotTransform = cfg.getSlotTransform;

    this.onPlace = cfg.onPlace;

    this.getCellSize = cfg.getCellSize;
  }

  public clearMarkers() {
    for (const m of this.slotMarkers) m.destroy();
    this.slotMarkers = [];
  }

  public showEmptySlotMarkers() {
    this.clearMarkers();

    const slots = this.getSlots();

    for (let i = 0; i < this.slotCount; i++) {
      if (slots[i] !== null) continue;

      const tr = this.getSlotTransform(i);
      const marker = this.makeEmptySlotMarker(tr.x, tr.y, i);

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

    for (let i = 0; i < this.slotCount; i++) {
      const slot = slots[i];
      if (slot === null) continue;

      const tr = this.getSlotTransform(i);

      const key = this.deviceKeys[slot];
      const img = this.scene.add.image(tr.x, tr.y, key);

      const cellSize = this.getCellSize();
      const targetSize = cellSize * 0.75;

      const scale = Math.min(
        targetSize / img.width,
        targetSize / img.height
      );

      img.setScale(scale);
      img.setRotation(tr.rotation);

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
