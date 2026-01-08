import Phaser from "phaser";

type TerraformingProgressCfg = {
  orientation: "vertical" | "horizontal";
  x: number;
  topY: number;
  w: number;
  h: number;
  max: number;
  colour?: number;
};

export default class TerraformingProgress {
  private bg: Phaser.GameObjects.Graphics;
  private fill: Phaser.GameObjects.Graphics;
  private orientation: "vertical" | "horizontal";
  private x: number;
  private topY: number;
  private w: number;
  private h: number;
  private colour: number;

  private max: number;
  private value = 0;

  private inset = 4;
  private radius = 14;

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, cfg: TerraformingProgressCfg) {
    this.orientation = cfg.orientation;
    this.x = cfg.x;
    this.topY = cfg.topY;
    this.w = cfg.w;
    this.h = cfg.h;
    this.max = Math.max(1, cfg.max);
    this.colour = cfg.colour ?? 0xff0000;

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

  private clampRadius(w: number, h: number, r: number) {
    return Math.max(0, Math.min(r, Math.floor(w / 2), Math.floor(h / 2)));
  }

  private redrawFill() {
    const ratio = Phaser.Math.Clamp(this.value / this.max, 0, 1);

    const x = this.x;
    const y = this.topY;
    const w = this.w;
    const h = this.h;

    const inset = 4;
    const ix = x - w / 2 + inset;
    const iy = y + inset;
    const iw = w - inset * 2;
    const ih = h - inset * 2;

    this.fill.clear();
    if (ratio <= 0) return;

    this.fill.fillStyle(this.colour, 0.85);

    const rBase = Math.max(2, Math.min(12, Math.floor(iw / 2), Math.floor(ih / 2)));
    const capPx = rBase * 2;

    const isFull = ratio >= 0.999;

    const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

    const minWidthFactor = 0.7;

    if (this.orientation === "vertical") {
      const rawH = ih * ratio;
      const bottom = iy + ih;

      if (rawH < capPx) {
        const t = Phaser.Math.Clamp(rawH / capPx, 0, 1);
        const e = easeOut(t);

        const puddleH = Math.max(3, Math.floor(capPx * e));

        const puddleW = Math.floor(
          iw * (minWidthFactor + (1 - minWidthFactor) * e)
        );

        const cx = ix + iw / 2;
        const cy = bottom - puddleH / 2;

        this.fill.fillEllipse(cx, cy, puddleW, puddleH);
        return;
      }

      const fillH = Math.floor(rawH);
      const fy = bottom - fillH;

      this.fill.fillRoundedRect(
        ix,
        fy,
        iw,
        fillH,
        {
          bl: rBase,
          br: rBase,
          tl: isFull ? rBase : 0,
          tr: isFull ? rBase : 0
        }
      );
    } else {
      const rawW = iw * ratio;
      const left = ix;

      if (rawW < capPx) {
        const t = Phaser.Math.Clamp(rawW / capPx, 0, 1);
        const e = easeOut(t);

        const puddleW = Math.max(3, Math.floor(capPx * e));
        const puddleH = Math.floor(
          ih * (minWidthFactor + (1 - minWidthFactor) * e)
        );

        const cx = left + puddleW / 2;
        const cy = iy + ih / 2;

        this.fill.fillEllipse(cx, cy, puddleW, puddleH);
        return;
      }

      const fillW = Math.floor(rawW);

      this.fill.fillRoundedRect(
        ix,
        iy,
        fillW,
        ih,
        {
          tl: rBase,
          bl: rBase,
          tr: isFull ? rBase : 0,
          br: isFull ? rBase : 0
        }
      );
    }
  }

  private drawFrame() {
    const x = this.x;
    const y = this.topY;
    const w = this.w;
    const h = this.h;

    const inset = this.inset;
    const ix = x - w / 2 + inset;
    const iy = y + inset;
    const iw = w - inset * 2;
    const ih = h - inset * 2;

    const r = this.clampRadius(iw, ih, this.radius);

    this.bg.clear();

    this.bg.fillStyle(0x11111a, 0.65);
    this.bg.fillRoundedRect(ix, iy, iw, ih, r);

    this.bg.lineStyle(4, 0xffffff, 0.55);
    this.bg.strokeRoundedRect(ix, iy, iw, ih, r);
  }

  public destroy() {
    this.bg.destroy();
    this.fill.destroy();
  }
}
