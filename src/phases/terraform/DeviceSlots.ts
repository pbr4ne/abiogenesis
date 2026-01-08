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

  onUpgrade?: (slotIndex: number) => void;
  canUpgrade?: (slotIndex: number) => boolean;

  getCellSize: () => number;
  fillCell?: boolean;
  fillCellBg?: number;
  fillCellBgAlpha?: number;
  fillCellPadMul?: number;

  plusKey?: string;
  plusMode?: "rotate" | "straight";
};

export default class DeviceSlots {
  private scene: Phaser.Scene;
  private world: Phaser.GameObjects.Container;

  private slotCount: number;

  private deviceKeys: readonly [string, string, string];
  private deviceColors: readonly [number, number, number];

  private getSlots: () => (0 | 1 | 2 | null)[];
  private getSlotTransform: (slotIndex: number) => SlotTransform;

  private emptySlotColor: number;
  private emptySlotHoverColor: number;

  private onPlace: (slotIndex: number) => void;

  private onUpgrade?: (slotIndex: number) => void;
  private canUpgrade?: (slotIndex: number) => boolean;

  private slotMarkers: Phaser.GameObjects.Container[] = [];
  private sprites: Phaser.GameObjects.Image[] = [];
  private upgradeIcons: Phaser.GameObjects.Container[] = []; //legacy
  private upgradeHits: Phaser.GameObjects.Zone[] = [];

  private getCellSize: () => number;
  private fillCell: boolean;
  private fillCellBg: number;
  private fillCellBgAlpha: number;
  private fillCellPadMul: number;

  private filledBgs: Phaser.GameObjects.Rectangle[] = [];

  private plusKey: string;
  private plusMode: "rotate" | "straight";

  private baseDeviceKeyByIndex: Map<number, string> = new Map();
  private baseDeviceTintByIndex: Map<number, number> = new Map();

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

    this.onUpgrade = cfg.onUpgrade;
    this.canUpgrade = cfg.canUpgrade;

    this.getCellSize = cfg.getCellSize;
    this.fillCell = cfg.fillCell === true;
    this.fillCellBg = cfg.fillCellBg ?? 0x061a33;
    this.fillCellBgAlpha = cfg.fillCellBgAlpha ?? 1;
    this.fillCellPadMul = cfg.fillCellPadMul ?? 0.08;

    this.plusKey = cfg.plusKey ?? "plus";
    this.plusMode = cfg.plusMode ?? "rotate";
  }

  public clearMarkers() {
    for (const m of this.slotMarkers) m.destroy();
    this.slotMarkers = [];
  }

  private clearUpgradeIcons() {
    for (const c of this.upgradeIcons) c.destroy();
    this.upgradeIcons = [];
  }

  private clearUpgradeHits() {
    for (const z of this.upgradeHits) z.destroy();
    this.upgradeHits = [];
  }

  private getNextTier(slot: 0 | 1 | 2): 1 | 2 | null {
    if (slot === 0) return 1;
    if (slot === 1) return 2;
    return null;
  }

  private applyPlusState(img: Phaser.GameObjects.Image, targetSize: number, plusTint: number, deviceRotation: number) {
    img.setTexture(this.plusKey);

    const s = Math.min(targetSize / img.width, targetSize / img.height);
    img.setScale(s);

    img.setTintFill(plusTint);
    img.setAlpha(0.95);

    if (this.plusMode === "rotate") img.setRotation(deviceRotation);
    else img.setRotation(0);
  }

  private applyBaseState(img: Phaser.GameObjects.Image, slotIndex: number, targetSize: number, deviceRotation: number) {
    const baseKey = this.baseDeviceKeyByIndex.get(slotIndex);
    const baseTint = this.baseDeviceTintByIndex.get(slotIndex);

    if (baseKey) img.setTexture(baseKey);

    const s = Math.min(targetSize / img.width, targetSize / img.height);
    img.setScale(s);

    if (baseTint !== undefined) img.setTintFill(baseTint);
    img.setAlpha(1);

    img.setRotation(deviceRotation);
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

  private pointerInWorldLocal(): { x: number; y: number } {
    const p = this.scene.input.activePointer;

    const m = this.world.getWorldTransformMatrix();
    const out = new Phaser.Math.Vector2();
    m.applyInverse(p.worldX, p.worldY, out);

    return { x: out.x, y: out.y };
  }

  public rebuildSprites() {
    this.clearUpgradeHits();

    for (const s of this.sprites) s.destroy();
    this.sprites = [];

    for (const b of this.filledBgs) b.destroy();
    this.filledBgs = [];

    this.baseDeviceKeyByIndex.clear();
    this.baseDeviceTintByIndex.clear();

    const slots = this.getSlots();
    const cellSize = this.getCellSize();

    const pointerLocal = this.pointerInWorldLocal();

    let cursorShouldBePointer = false;

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

      const deviceKey = this.deviceKeys[slot];
      const deviceTint = this.deviceColors[slot];

      const img = this.scene.add.image(tr.x, tr.y, deviceKey);

      const pad = cellSize * this.fillCellPadMul;
      const targetSize = cellSize - pad * 2;

      const baseScale = Math.min(targetSize / img.width, targetSize / img.height);
      img.setScale(baseScale);
      img.setRotation(tr.rotation);
      img.setTintFill(deviceTint);

      this.world.add(img);
      this.sprites.push(img);

      this.baseDeviceKeyByIndex.set(i, deviceKey);
      this.baseDeviceTintByIndex.set(i, deviceTint);

      if (!this.onUpgrade) continue;

      const nextTier = this.getNextTier(slot);
      if (!nextTier) continue;

      const hitRadius = Math.max(28, Math.round(cellSize * 0.32));

      const hit = this.scene.add.zone(tr.x, tr.y, hitRadius * 2, hitRadius * 2).setOrigin(0.5, 0.5);
      hit.setInteractive(new Phaser.Geom.Circle(hitRadius, hitRadius, hitRadius), Phaser.Geom.Circle.Contains);

      this.world.add(hit);
      this.upgradeHits.push(hit);

      const showPlusIfAllowed = () => {
        if (!this.canUpgrade || !this.canUpgrade(i)) return false;

        cursorShouldBePointer = true;
        this.applyPlusState(img, targetSize, this.deviceColors[nextTier], tr.rotation);
        return true;
      };

      const restoreBase = () => {
        this.scene.input.setDefaultCursor("default");
        this.applyBaseState(img, i, targetSize, tr.rotation);
      };

      hit.on("pointerover", () => {
        if (!showPlusIfAllowed()) return;
        this.scene.input.setDefaultCursor("pointer");
      });

      hit.on("pointerout", () => {
        restoreBase();
      });

      hit.on("pointerdown", () => {
        if (!this.onUpgrade) return;
        if (!this.canUpgrade || !this.canUpgrade(i)) return;
        this.onUpgrade(i);
      });

      const dx = pointerLocal.x - tr.x;
      const dy = pointerLocal.y - tr.y;
      const isPointerInside = dx * dx + dy * dy <= hitRadius * hitRadius;

      if (isPointerInside) showPlusIfAllowed();
    }

    if (cursorShouldBePointer) this.scene.input.setDefaultCursor("pointer");
  }

  public destroy() {
    this.clearMarkers();
    this.clearUpgradeIcons();
    this.clearUpgradeHits();

    for (const s of this.sprites) s.destroy();
    this.sprites = [];

    for (const b of this.filledBgs) b.destroy();
    this.filledBgs = [];
  }
}
