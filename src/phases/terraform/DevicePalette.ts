import Phaser from "phaser";
import type { DeviceButtonTheme } from "./TerraformingView";

type DeviceButtonsCfg =
  | {
    layout?: "row";
    y: number;
    radius?: number;
    xPositions?: [number, number, number];
    imageKeys: readonly [string, string, string];
    costs: Record<0 | 1 | 2, number>;
    getPoints: () => number;
    onSelect: (device: 0 | 1 | 2) => void;
    theme?: DeviceButtonTheme;
  }
  | {
    layout: "col";
    x: number;
    topY: number;
    spacing?: number;
    radius?: number;
    imageKeys: readonly [string, string, string];
    costs: Record<0 | 1 | 2, number>;
    getPoints: () => number;
    onSelect: (device: 0 | 1 | 2) => void;
    theme?: DeviceButtonTheme;
  };

const clamp255 = (n: number) => Math.max(0, Math.min(255, n));

const lighten = (hex: number, mul: number) => {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;

  const rr = clamp255(Math.round(r + (255 - r) * mul));
  const gg = clamp255(Math.round(g + (255 - g) * mul));
  const bb = clamp255(Math.round(b + (255 - b) * mul));

  return (rr << 16) | (gg << 8) | bb;
};

export default class DeviceButtons {
  public readonly buttons = new Map<0 | 1 | 2, Phaser.GameObjects.Container>();

  private scene: Phaser.Scene;
  private parent: Phaser.GameObjects.Container;

  private y: number;
  private radius: number;
  private xPositions: [number, number, number];

  private imageKeys: readonly [string, string, string];
  private costs: Record<0 | 1 | 2, number>;

  private getPoints: () => number;
  private onSelect: (device: 0 | 1 | 2) => void;

  private layout: "row" | "col";
  private x: number;
  private topY: number;
  private spacing: number;

  private theme?: DeviceButtonTheme;

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, cfg: DeviceButtonsCfg) {
    this.scene = scene;
    this.parent = parent;

    this.radius = cfg.radius ?? 100;
    this.layout = cfg.layout ?? "row";
    this.radius = cfg.radius ?? 100;

    this.theme = cfg.theme;

    if (cfg.layout === "col") {
      this.layout = "col";
      this.x = cfg.x;
      this.topY = cfg.topY;
      this.spacing = cfg.spacing ?? (this.radius * 2 + 26) + 30;

      this.y = 0;
      this.xPositions = [-360, 0, 360];
    } else {
      this.layout = "row";
      this.y = cfg.y;
      this.xPositions = cfg.xPositions ?? [-360, 0, 360];

      this.x = 0;
      this.topY = 0;
      this.spacing = 0;
    }

    this.imageKeys = cfg.imageKeys;
    this.costs = cfg.costs;

    this.getPoints = cfg.getPoints;
    this.onSelect = cfg.onSelect;

    this.rebuild();
  }

  private rebuild() {
    for (const btn of this.buttons.values()) btn.destroy();
    this.buttons.clear();

    for (let i = 0; i < 3; i++) {
      const device = i as 0 | 1 | 2;

      let x: number;
      let y: number;

      if (this.layout === "col") {
        x = this.x;
        y = this.topY + i * this.spacing;
      } else {
        x = this.xPositions[i];
        y = this.y;
      }

      const btn = this.makeRoundedRectImageButton(x, y, this.radius, this.imageKeys[i], device);
      this.parent.add(btn);
      this.buttons.set(device, btn);
    }

    this.updateEnabled();
  }

  public updateEnabled() {
    for (const [device, btn] of this.buttons) {
      const cost = this.costs[device];
      const affordable = this.getPoints() >= cost;

      btn.setAlpha(affordable ? 1 : 0.4);

      const hit = btn.getData("hit") as Phaser.GameObjects.Zone | undefined;
      if (!hit) continue;

      if (affordable) hit.setInteractive();
      else hit.disableInteractive();
    }
  }

  private drawButtonGlow(g: Phaser.GameObjects.Graphics, radius: number, color: number, cornerR: number) {
    g.clear();

    const layers = 18;
    const inner = radius * 1.02;
    const outer = radius * 1.22;

    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1);
      const r = Phaser.Math.Linear(inner, outer, t);
      const a = 0.16 * Math.pow(1 - t, 2.15);

      const size = r * 2;
      g.lineStyle(8, color, a);
      g.strokeRoundedRect(-size / 2, -size / 2, size, size, cornerR);
    }
  }

  private makeRoundedRectImageButton(localX: number, localY: number, radius: number, imageKey: string, deviceIndex: 0 | 1 | 2) {
    const btn = this.scene.add.container(localX, localY);

    const strokeIdle = this.theme?.stroke?.[deviceIndex] ?? (this.theme?.idleStrokeFallback ?? 0x494949);
    const glowCol = this.theme?.glow?.[deviceIndex] ?? 0x9fd6ff;
    const bgFill = this.theme?.bgFill ?? 0x20202c;
    const hoverMul = this.theme?.hoverStrokeMul ?? 0.40;
    const strokeHover = lighten(strokeIdle, hoverMul);

    const size = radius * 2;

    const cornerR = Math.max(12, Math.round(size * 0.12));

    const bg = this.scene.add.graphics();

    const draw = (strokeColor: number) => {
      bg.clear();
      bg.fillStyle(bgFill, 1);
      bg.fillRoundedRect(-size / 2, -size / 2, size, size, cornerR);
      bg.lineStyle(4, strokeColor, 1);
      bg.strokeRoundedRect(-size / 2, -size / 2, size, size, cornerR);
    };

    draw(strokeIdle);

    const glow = this.scene.add.graphics();
    this.drawButtonGlow(glow, radius, glowCol, cornerR);

    const img = this.scene.add.image(0, 0, imageKey);
    img.setTintFill(this.theme?.stroke?.[deviceIndex] ?? 0xffffff);

    const pad = 36;
    const max = size - pad * 2;
    const scale = Math.min(max / img.width, max / img.height);
    img.setScale(scale);

    const hit = this.scene.add.zone(0, 0, size, size).setOrigin(0.5, 0.5);
    hit.setInteractive();

    hit.on("pointerover", () => {
      if (!hit.input?.enabled) return;
      this.scene.input.setDefaultCursor("pointer");
      draw(strokeHover);
      btn.setScale(1.02);
    });

    hit.on("pointerout", () => {
      this.scene.input.setDefaultCursor("default");
      draw(strokeIdle);
      btn.setScale(1.0);
    });

    hit.on("pointerdown", () => {
      if (!hit.input?.enabled) return;
      this.onSelect(deviceIndex);
    });

    btn.setData("hit", hit);

    btn.add(glow);
    btn.add(bg);
    btn.add(img);
    btn.add(hit);

    return btn;
  }

  public destroy() {
    for (const btn of this.buttons.values()) {
      btn.destroy();
    }
    this.buttons.clear();
  }
}
