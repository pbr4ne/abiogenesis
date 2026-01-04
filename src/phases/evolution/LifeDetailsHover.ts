import Phaser from "phaser";
import { LifeFormDef, LifeFormInstance } from "./EvolutionTypes";

export type LifePayload = { lf: LifeFormInstance; def: LifeFormDef } | null;
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

export default class LifeDetailsHover extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Image;
  private bars: Record<StatKey, VBar>;

  private wi = 420;
  private h = 580;

  private dockPadRight = 96;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.setScrollFactor(0);
    this.setDepth(20001);

    this.bg = scene.add.rectangle(0, 0, this.wi, this.h, 0x0b0b0b, 0.78);
    this.bg.setStrokeStyle(3, 0xffffff, 0.25);

    const iconSize = 170;
    this.icon = scene.add.image(0, -this.h / 2 + iconSize / 2 + 32, "prokaryote");
    this.icon.setDisplaySize(iconSize, iconSize);

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
      this.icon,

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

  private dockRight() {
    const x = this.scene.scale.width - this.wi / 2 - this.dockPadRight;
    const y = this.scene.scale.height / 2;
    this.setPosition(x, y);
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

  public hide() {
    this.setVisible(false);
    this.dockRight();
  }

  private render(payload: LifePayload) {
    if (!payload) {
      this.setVisible(false);
      return;
    }

    const { lf, def } = payload;
    const tint = rgbToHex(def.colour.r, def.colour.g, def.colour.b);

    this.bg.setStrokeStyle(3, tint, 0.95);

    this.icon.setTexture(def.type);
    this.icon.setTintFill(tint);

    this.applyBar("mutation", lf.mutationRate, tint);
    this.applyBar("reproduction", lf.reproductionRate, tint);
    this.applyBar("survival", lf.survivalRate, tint);

    this.setVisible(true);
  }

  public setLife(payload: LifePayload) {
    if (!payload) {
      this.hide();
      return;
    }

    this.dockRight();
    this.render(payload);
  }

  public setLifeAt(payload: LifePayload, anchorX: number, anchorY: number, anchorSize = 70) {
    if (!payload) {
      this.setVisible(false);
      return;
    }

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
    this.render(payload);
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
}
