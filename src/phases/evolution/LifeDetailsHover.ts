import Phaser from "phaser";
import { LifeFormDef, LifeFormInstance } from "./EvolutionTypes";

export type LifePayload =
  | { lf: LifeFormInstance | null; def: LifeFormDef; mode?: "instance" | "summary"; score100?: number; extinct?: boolean }
  | null;

type StatKey = "mutation" | "reproduction" | "survival";

type VBar = {
  bg: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Graphics;
  ticks: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Image;

  topY: number;
  botY: number;
  innerH: number;
  pad: number;
  w: number;
};

const rgbToHex = (r: number, g: number, b: number) => (r << 16) | (g << 8) | b;

type DockMode = "right" | "manual";

export default class LifeDetailsHover extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Image;
  private deathMark: Phaser.GameObjects.Image;

  private intelRing: Phaser.GameObjects.Graphics;
  private intelIcon: Phaser.GameObjects.Image;

  private bars: Record<StatKey, VBar>;

  private wi = 420;
  private h = 580;

  private dockPadRight = 96;

  private instanceScale = 1.0;
  private currentScale = 1.0;

  private baseWi = 420;
  private baseH = 580;

  private extinctWi = 420;
  private extinctH = 430;

  private iconSize = 170;

  private intelIconSize = 84;
  private intelYOffset = 80;

  private summaryIntelRadius = 128;
  private summaryIntelThick = 14;
  private summaryIntelIconSize = 164;

  private dockMode: DockMode = "right";

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.setScrollFactor(0);
    this.setDepth(20001);

    this.wi = this.baseWi;
    this.h = this.baseH;

    this.bg = scene.add.rectangle(0, 0, this.wi, this.h, 0x0b0b0b, 0.98);
    this.bg.setStrokeStyle(3, 0xffffff, 0.25);

    const iconSize = 170;
    const iconY = -this.h / 2 + iconSize / 2 + 32;

    this.deathMark = scene.add.image(0, iconY, "death");
    this.deathMark.setOrigin(0.5, 0.55);
    this.deathMark.setDisplaySize(iconSize * 1.05, iconSize * 1.05);
    this.deathMark.setTintFill(0xffffff);
    this.deathMark.setAlpha(0);

    this.icon = scene.add.image(0, iconY, "prokaryote");
    this.icon.setDisplaySize(iconSize, iconSize);

    const intelY = iconY + iconSize / 2 + 92 + this.intelYOffset;

    this.intelRing = scene.add.graphics();
    this.intelRing.setPosition(0, intelY);

    this.intelIcon = scene.add.image(0, intelY, "intelligence");
    this.intelIcon.setDisplaySize(64, 64);
    this.intelIcon.setAlpha(0.9);

    const barAreaY = this.h / 2 - 240;
    const barH = 150;

    const barW = 26;
    const gap = 102;

    this.bars = {
      mutation: this.makeVBar(scene, -gap, barAreaY, barW, barH, "life_form_mutated"),
      reproduction: this.makeVBar(scene, 0, barAreaY, barW, barH, "life_form_reproduced"),
      survival: this.makeVBar(scene, gap, barAreaY, barW, barH, "life_form_hearts")
    };

    this.add([
      this.bg,
      this.deathMark,
      this.icon,
      this.intelRing,
      this.intelIcon,
      ...this.flattenBars()
    ]);

    this.dockRight();

    this.setVisible(false);
    scene.add.existing(this);
  }

  private flattenBars() {
    return Object.values(this.bars).flatMap(b => [
      b.bg,
      b.fill,
      b.ticks,
      b.icon
    ]);
  }

  private makeVBar(scene: Phaser.Scene, x: number, y: number, w: number, h: number, bottomIconKey: string): VBar {
    const pad = 4;

    const bg = scene.add.rectangle(x, y, w, h, 0x1a1a1a, 1);
    bg.setStrokeStyle(3, 0xffffff, 0.18);

    const topY = y - h / 2 + pad;
    const botY = y + h / 2 - pad;
    const innerH = botY - topY;

    const fill = scene.add.graphics();
    fill.setPosition(0, 0);

    const ticks = scene.add.graphics();
    ticks.setPosition(x, y);

    const iconSize = 64;
    const icon = scene.add.image(x, y + h / 2 + 56, bottomIconKey);
    icon.setDisplaySize(iconSize, iconSize);

    return { bg, fill, ticks, icon, topY, botY, innerH, pad, w };
  }

  private drawIntelRing(tint: number, p01: number, alpha: number, radius: number, thick: number) {
    this.intelRing.clear();

    this.intelRing.lineStyle(thick, tint, alpha * 0.18);
    this.intelRing.beginPath();
    this.intelRing.arc(0, 0, radius, 0, Math.PI * 2);
    this.intelRing.strokePath();

    const a0 = -Math.PI / 2;
    const a1 = a0 + Math.PI * 2 * Phaser.Math.Clamp(p01, 0, 1);

    this.intelRing.lineStyle(thick, tint, alpha);
    this.intelRing.beginPath();
    this.intelRing.arc(0, 0, radius, a0, a1);
    this.intelRing.strokePath();
  }

  private applyLayout(mode: "instance" | "summary", extinct: boolean) {
    const useExtinctLayout = mode === "summary" && extinct;

    const wi = useExtinctLayout ? this.extinctWi : this.baseWi;
    const h = useExtinctLayout ? this.extinctH : this.baseH;

    this.wi = wi;
    this.h = h;

    this.bg.setSize(wi, h);

    const iconY = -h / 2 + this.iconSize / 2 + 32;

    if (useExtinctLayout) {
      this.icon.setPosition(0, 0);
      this.deathMark.setPosition(0, 0);
    } else {
      this.icon.setPosition(0, iconY);
      this.deathMark.setPosition(0, iconY);
    }

    this.deathMark.setDisplaySize(this.iconSize * 1.05, this.iconSize * 1.05);

    const intelY = iconY + this.iconSize / 2 + 92 + this.intelYOffset;
    this.intelRing.setPosition(0, intelY);
    this.intelIcon.setPosition(0, intelY);
  }

  private setBarsVisible(visible: boolean) {
    for (const b of Object.values(this.bars)) {
      b.bg.setVisible(visible);
      b.fill.setVisible(visible);
      b.ticks.setVisible(visible);
      b.icon.setVisible(visible);
    }
  }

  private render(payload: LifePayload) {
    if (!payload) {
      this.setVisible(false);
      return;
    }

    const { lf, def } = payload;
    const mode = payload.mode ?? "instance";
    const extinct = payload.extinct === true;

    this.applyLayout(mode, extinct);

    const tint = rgbToHex(def.colour.r, def.colour.g, def.colour.b);

    this.bg.setStrokeStyle(3, tint, 0.95);

    this.icon.setTexture(def.type);
    this.icon.setTintFill(tint);

    if (mode === "summary") {
      this.setBarsVisible(false);

      if (extinct) {
        this.intelRing.setVisible(false);
        this.intelIcon.setVisible(false);

        this.deathMark.setAlpha(0.25);
        this.icon.setAlpha(0.45);

        this.setVisible(true);
        return;
      }

      const score100 = payload.score100 ?? 0;
      const p01 = Phaser.Math.Clamp(score100 / 100, 0, 1);

      this.intelRing.setVisible(true);
      this.intelIcon.setVisible(true);

      this.intelIcon.setTintFill(tint);
      this.intelIcon.setDisplaySize(this.summaryIntelIconSize, this.summaryIntelIconSize);

      this.deathMark.setAlpha(0);
      this.icon.setAlpha(1);

      this.drawIntelRing(tint, p01, 0.9, this.summaryIntelRadius, this.summaryIntelThick);

      this.setVisible(true);
      return;
    }

    this.intelRing.setVisible(false);
    this.intelIcon.setVisible(false);
    this.intelIcon.setDisplaySize(this.intelIconSize, this.intelIconSize);

    this.setBarsVisible(true);

    this.deathMark.setAlpha(0);

    if (!lf) {
      this.icon.setAlpha(0.35);

      this.applyBar("mutation", 0, tint);
      this.applyBar("reproduction", 0, tint);
      this.applyBar("survival", 0, tint);

      for (const b of Object.values(this.bars)) {
        b.bg.setAlpha(0.35);
        b.icon.setAlpha(0.35);
        b.fill.setAlpha(0.25);
        b.ticks.setAlpha(0.25);
      }

      this.setVisible(true);
      return;
    }

    this.icon.setAlpha(1);
    for (const b of Object.values(this.bars)) {
      b.bg.setAlpha(1);
      b.icon.setAlpha(1);
      b.fill.setAlpha(1);
      b.ticks.setAlpha(1);
    }

    this.applyBar("mutation", lf.mutationRate, tint);
    this.applyBar("reproduction", lf.reproductionRate, tint);
    this.applyBar("survival", lf.survivalRate, tint);

    this.setVisible(true);
  }

  public setLifeAt(payload: LifePayload, anchorX: number, anchorY: number, anchorSize = 70) {
    if (!payload) {
      this.setVisible(false);
      return;
    }

    this.render(payload);

    const margin = 14;
    const offX = anchorSize * 0.75 + this.wi / 2 + margin;

    const sw = this.scene.scale.width;
    const sh = this.scene.scale.height;

    let x = anchorX + offX;
    let y = anchorY;

    if (x + this.wi / 2 > sw - margin) x = anchorX - offX;
    if (x - this.wi / 2 < margin) x = Phaser.Math.Clamp(x, margin + this.wi / 2, sw - margin - this.wi / 2);

    y = Phaser.Math.Clamp(y, margin + this.h / 2, sh - margin - this.h / 2);

    this.setPosition(x, y);
  }

  private applyBar(key: StatKey, value: number, tint: number) {
    const b = this.bars[key];

    b.bg.setStrokeStyle(3, tint, 0.9);
    b.icon.setTintFill(tint);

    const p01 = Phaser.Math.Clamp(value / 5, 0, 1);
    const fillH = Math.floor(b.innerH * p01);

    b.fill.clear();

    if (fillH > 0) {
      b.fill.fillStyle(tint, 1);

      const x0 = (b.bg.x as number) - (b.w / 2) + b.pad;
      const y0 = b.botY - fillH;
      const ww = b.w - 2 * b.pad;
      const hh = fillH;

      b.fill.fillRect(x0, y0, ww, hh);
    }

    b.ticks.clear();
    b.ticks.lineStyle(2, tint, 0.35);

    const cy = b.bg.y as number;

    const x0 = -(b.bg.width as number) / 2 + 2;
    const x1 = +(b.bg.width as number) / 2 - 2;

    for (let i = 1; i < 5; i++) {
      const yy = b.botY - (b.innerH * i) / 5;
      const y = yy - cy;
      b.ticks.beginPath();
      b.ticks.moveTo(x0, y);
      b.ticks.lineTo(x1, y);
      b.ticks.strokePath();
    }
  }

  public setDockMode(mode: DockMode) {
    this.dockMode = mode;
    if (mode === "right") this.dockRight();
  }

  public dockManual(x: number, y: number) {
    this.dockMode = "manual";
    this.setPosition(x, y);
  }

  private dockRight() {
    if (this.dockMode !== "right") return;

    const x = this.scene.scale.width - this.wi / 2 - this.dockPadRight;
    const y = this.scene.scale.height / 2;
    this.setPosition(x, y);
  }

  public hide() {
    this.setVisible(false);
    this.currentScale = this.instanceScale;
    this.setScale(this.currentScale);
    if (this.dockMode === "right") this.dockRight();
  }

  public setLife(payload: LifePayload) {
    if (!payload) {
      this.hide();
      return;
    }

    this.render(payload);

    if (this.dockMode === "right") this.dockRight();
  }
}
