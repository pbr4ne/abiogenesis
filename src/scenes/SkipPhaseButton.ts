import Phaser from "phaser";

type SkipPhaseButtonCfg = {
  size?: number;
  radius?: number;
  depthBase?: number;
  tooltipLeftKey: string;
  tooltipMidKey: string;
  tooltipRightKey: string;
  onClick: () => void;
};

export default class SkipPhaseButton {
  private scene: Phaser.Scene;

  private x: number;
  private y: number;

  private size: number;
  private r: number;

  private bg: Phaser.GameObjects.Graphics;
  private icon: Phaser.GameObjects.Image;
  private zone: Phaser.GameObjects.Zone;

  private tip: Phaser.GameObjects.Container;
  private tipBg: Phaser.GameObjects.Graphics;
  private tipLeft: Phaser.GameObjects.Image;
  private tipMid: Phaser.GameObjects.Image;
  private tipRight: Phaser.GameObjects.Image;

  private hovered = false;

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: SkipPhaseButtonCfg) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    this.size = cfg.size ?? 78;
    this.r = cfg.radius ?? 16;

    const depthBase = cfg.depthBase ?? 1000;

    this.bg = scene.add.graphics();
    this.bg.setScrollFactor(0);
    this.bg.setDepth(depthBase);

    this.icon = scene.add.image(x, y, "wormhole");
    this.icon.setScrollFactor(0);
    this.icon.setDepth(depthBase + 1);
    this.icon.setTintFill(0xffffff);
    this.icon.setAlpha(0.55);

    this.fitIconTo(this.icon, Math.floor(this.size * 0.62));

    this.zone = scene.add.zone(x, y, this.size, this.size);
    this.zone.setScrollFactor(0);
    this.zone.setDepth(depthBase + 2);
    this.zone.setInteractive({ useHandCursor: true });

    const tipDepth = depthBase + 10;

    this.tipBg = scene.add.graphics();
    this.tipBg.setScrollFactor(0);

    this.tipLeft = scene.add.image(0, 0, cfg.tooltipLeftKey);
    this.tipLeft.setScrollFactor(0);
    this.tipLeft.setTintFill(0xffffff);

    this.tipMid = scene.add.image(0, 0, cfg.tooltipMidKey);
    this.tipMid.setScrollFactor(0);
    this.tipMid.setTintFill(0xffffff);

    this.tipRight = scene.add.image(0, 0, cfg.tooltipRightKey);
    this.tipRight.setScrollFactor(0);
    this.tipRight.setTintFill(0xffffff);

    this.tip = scene.add.container(0, 0, [this.tipBg, this.tipLeft, this.tipMid, this.tipRight]);
    this.tip.setScrollFactor(0);
    this.tip.setDepth(tipDepth);
    this.tip.setVisible(false);
    this.tip.setAlpha(0);

    this.tipBg.setDepth(tipDepth);
    this.tipLeft.setDepth(tipDepth + 1);
    this.tipMid.setDepth(tipDepth + 1);
    this.tipRight.setDepth(tipDepth + 1);

    const draw = () => {
      this.bg.clear();

      this.bg.fillStyle(0x141a22, this.hovered ? 0.98 : 0.9);
      this.bg.fillRoundedRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size, this.r);

      this.bg.lineStyle(2, 0xffffff, this.hovered ? 0.5 : 0.28);
      this.bg.strokeRoundedRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size, this.r);

      this.drawTooltip();
    };

    const onOver = () => {
      this.hovered = true;
      draw();

      scene.tweens.killTweensOf(this.icon);
      scene.tweens.add({
        targets: this.icon,
        scale: this.icon.scaleX * 1.08,
        alpha: 1,
        duration: 120,
        ease: "Sine.easeOut"
      });

      this.tip.setVisible(true);
      scene.tweens.killTweensOf(this.tip);
      scene.tweens.add({
        targets: this.tip,
        alpha: 1,
        duration: 120,
        ease: "Sine.easeOut"
      });
    };

    const onOut = () => {
      this.hovered = false;
      draw();

      scene.tweens.killTweensOf(this.icon);
      scene.tweens.add({
        targets: this.icon,
        scale: this.icon.scaleX / 1.08,
        alpha: 0.55,
        duration: 120,
        ease: "Sine.easeOut"
      });

      scene.tweens.killTweensOf(this.tip);
      scene.tweens.add({
        targets: this.tip,
        alpha: 0,
        duration: 120,
        ease: "Sine.easeOut",
        onComplete: () => this.tip.setVisible(false)
      });
    };

    const onDown = () => {
      cfg.onClick();
    };

    this.zone.on("pointerover", onOver);
    this.zone.on("pointerout", onOut);
    this.zone.on("pointerdown", onDown);

    draw();

    this.destroy = () => {
      this.zone.off("pointerover", onOver);
      this.zone.off("pointerout", onOut);
      this.zone.off("pointerdown", onDown);

      scene.tweens.killTweensOf(this.icon);
      scene.tweens.killTweensOf(this.tip);

      this.bg.destroy();
      this.icon.destroy();
      this.zone.destroy();

      this.tip.destroy();
      this.tipBg.destroy();
      this.tipLeft.destroy();
      this.tipMid.destroy();
      this.tipRight.destroy();
    };
  }

  private fitIconTo(img: Phaser.GameObjects.Image, maxPx: number) {
    const maxDim = Math.max(img.width, img.height);
    const s = maxPx / maxDim;
    img.setScale(s);
  }

  private drawTooltip() {
    const tipIconPx = Math.floor(this.size * 0.74);

    this.fitIconTo(this.tipLeft, tipIconPx);
    this.fitIconTo(this.tipMid, tipIconPx);
    this.fitIconTo(this.tipRight, tipIconPx);

    const gap = 18;

    const w0 = this.tipLeft.displayWidth;
    const w1 = this.tipMid.displayWidth;
    const w2 = this.tipRight.displayWidth;

    const contentW = w0 + gap + w1 + gap + w2;
    const contentH = Math.max(this.tipLeft.displayHeight, this.tipMid.displayHeight, this.tipRight.displayHeight);

    const padX = 18;
    const padY = 14;

    const boxW = Math.ceil(contentW + padX * 2);
    const boxH = Math.ceil(contentH + padY * 2);

    const tipX = this.x;
    const tipY = this.y - this.size / 2 - 14 - boxH / 2;

    this.tip.setPosition(tipX, tipY);

    const left = -boxW / 2;
    const top = -boxH / 2;

    this.tipBg.clear();
    this.tipBg.fillStyle(0x141a22, 0.98);
    this.tipBg.fillRoundedRect(left, top, boxW, boxH, 14);
    this.tipBg.lineStyle(2, 0xffffff, 0.36);
    this.tipBg.strokeRoundedRect(left, top, boxW, boxH, 14);

    let cx = -contentW / 2;

    this.tipLeft.setPosition(cx + w0 / 2, 0);
    cx += w0 + gap;

    this.tipMid.setPosition(cx + w1 / 2, 0);
    cx += w1 + gap;

    this.tipRight.setPosition(cx + w2 / 2, 0);
  }

  getObjects(): Phaser.GameObjects.GameObject[] {
    return [this.bg, this.icon, this.zone, this.tip];
  }

  destroy() { }
}
