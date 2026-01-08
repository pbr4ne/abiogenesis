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
  deviceColors: readonly [number, number, number];

  emptySlotColor?: number;
  emptySlotHoverColor?: number;

  getSlots: () => (0 | 1 | 2 | null)[];
  getSlotTransform: (slotIndex: number) => SlotTransform;

  onPlace: (slotIndex: number) => void;

  getCellSize: () => number;
  fillCell?: boolean;
  fillCellBg?: number;
  fillCellBgAlpha?: number;
  fillCellPadMul?: number;
};

export default class DeviceSlots {
  private scene: Phaser.Scene;
  private world: Phaser.GameObjects.Container;

  private slotCount: number;

  private deviceKeys: readonly [string, string, string];

  private getSlots: () => (0 | 1 | 2 | null)[];
  private getSlotTransform: (slotIndex: number) => SlotTransform;

  private emptySlotColor: number;
  private emptySlotHoverColor: number;

  private onPlace: (slotIndex: number) => void;

  private slotMarkers: Phaser.GameObjects.Container[] = [];
  private sprites: Phaser.GameObjects.Image[] = [];

  private getCellSize: () => number;
  private fillCell: boolean;
  private fillCellBg: number;
  private fillCellBgAlpha: number;
  private fillCellPadMul: number;

  private filledBgs: Phaser.GameObjects.Rectangle[] = [];

  private deviceColors: readonly [number, number, number];

  constructor(cfg: DeviceSlotsCfg) {
    this.scene = cfg.scene;
    this.world = cfg.world;

    this.slotCount = cfg.slotCount;

    this.deviceKeys = cfg.deviceKeys;
    this.deviceColors = cfg.deviceColors;

    this.getSlots = cfg.getSlots;
    this.getSlotTransform = cfg.getSlotTransform;
    this.emptySlotColor = cfg.emptySlotColor ?? 0xffff00;
    this.emptySlotHoverColor = cfg.emptySlotHoverColor ?? 0xffd84d;

    this.onPlace = cfg.onPlace;

    this.getCellSize = cfg.getCellSize;
    this.fillCell = cfg.fillCell === true;
    this.fillCellBg = cfg.fillCellBg ?? 0x061a33;
    this.fillCellBgAlpha = cfg.fillCellBgAlpha ?? 1;
    this.fillCellPadMul = cfg.fillCellPadMul ?? 0.08;
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
    dot.lineStyle(4, this.emptySlotColor, 0.85);
    dot.strokeCircle(0, 0, 16);

    const hitRadius = 48;
    const hit = this.scene.add.zone(0, 0, hitRadius * 2, hitRadius * 2).setOrigin(0.5, 0.5);
    hit.setInteractive(new Phaser.Geom.Circle(hitRadius, hitRadius, hitRadius), Phaser.Geom.Circle.Contains);

    hit.on("pointerover", () => {
      this.scene.input.setDefaultCursor("pointer");
      dot.clear();
      dot.lineStyle(5, this.emptySlotHoverColor, 1);
      dot.strokeCircle(0, 0, 18);
    });

    hit.on("pointerout", () => {
      this.scene.input.setDefaultCursor("default");
      dot.clear();
      dot.lineStyle(4, this.emptySlotColor, 0.85);
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

    for (const b of this.filledBgs) b.destroy();
    this.filledBgs = [];

    const slots = this.getSlots();
    const cellSize = this.getCellSize();

    for (let i = 0; i < this.slotCount; i++) {
      const slot = slots[i];
      if (slot === null) continue;

      const tr = this.getSlotTransform(i);

      if (this.fillCell) {
        const bg = this.scene.add.rectangle(tr.x, tr.y, cellSize, cellSize, this.fillCellBg, this.fillCellBgAlpha);
        bg.setOrigin(0.5, 0.5);
        this.world.add(bg);
        this.filledBgs.push(bg);
      }

      const key = this.deviceKeys[slot];
      const img = this.scene.add.image(tr.x, tr.y, key);

      const tint = this.deviceColors[slot];
      img.setTintFill(tint);

      const pad = cellSize * this.fillCellPadMul;
      const targetSize = cellSize - pad * 2;

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

    for (const b of this.filledBgs) b.destroy();
    this.filledBgs = [];
  }
}
