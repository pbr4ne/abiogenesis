import Phaser from "phaser";

type TerraformingProgressCfg = {
  orientation: "vertical" | "horizontal";
  x: number;
  topY: number;
  w: number;
  h: number;
  max: number;
};

export default class TerraformingProgress {
  private bg: Phaser.GameObjects.Graphics;
  private fill: Phaser.GameObjects.Graphics;
  private orientation: "vertical" | "horizontal";
  private x: number;
  private topY: number;
  private w: number;
  private h: number;

  private max: number;
  private value = 0;

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, cfg: TerraformingProgressCfg) {
    this.orientation = cfg.orientation;
    this.x = cfg.x;
    this.topY = cfg.topY;
    this.w = cfg.w;
    this.h = cfg.h;
    this.max = cfg.max;

    this.bg = scene.add.graphics();
    this.fill = scene.add.graphics();

    parent.add(this.bg);
    parent.add(this.fill);

    this.drawFrame();
    this.redrawFill();
  }

  public setMax(max: number) {
    this.max = Math.max(1, max);
    this.redrawFill();
  }

  public setValue(value: number) {
    this.value = value;
    this.redrawFill();
  }

  private drawFrame() {
    const x = this.x;
    const y = this.topY;
    const w = this.w;
    const h = this.h;

    this.bg.clear();
    this.bg.fillStyle(0x11111a, 0.65);
    this.bg.fillRect(x - w / 2, y, w, h);

    this.bg.lineStyle(4, 0xffffff, 0.55);
    this.bg.strokeRect(x - w / 2, y, w, h);
  }

  private redrawFill() {
    const ratio = Phaser.Math.Clamp(this.value / this.max, 0, 1);

    const x = this.x;
    const y = this.topY;
    const w = this.w;
    const h = this.h;

    const inset = 4;
    const iw = w - inset * 2;
    const ih = h - inset * 2;

    this.fill.clear();
    if (ratio <= 0) return;

    this.fill.fillStyle(0xff0000, 0.85);

    if (this.orientation === "horizontal") {
      const fillW = Math.floor(iw * ratio);
      this.fill.fillRect(
        x - w / 2 + inset,
        y + inset,
        fillW,
        ih
      );
    } else {
      const fillH = Math.floor(ih * ratio);
      const fillY = y + inset + (ih - fillH);

      this.fill.fillRect(
        x - iw / 2,
        fillY,
        iw,
        fillH
      );
    }
  }

  public destroy() {
    this.bg.destroy();
    this.fill.destroy();
  }
}
