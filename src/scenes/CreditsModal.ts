import Phaser from "phaser";

export type CreditLink = {
  iconKey: string;
  url?: string;
  color: number;
};

type CreditsModalCfg = {
  scene: Phaser.Scene;
  rows: CreditLink[][];

  depth?: number;

  btnSize?: number;
  gap?: number;
  rowGap?: number;
  radius?: number;

  panelPad?: number;

  backdropAlpha?: number;

  closeInset?: number;
  closeFontMul?: number;
  closeGapBelow?: number;
};

export default class CreditsModal extends Phaser.GameObjects.Container {
  private sceneRef: Phaser.Scene;

  private bgG: Phaser.GameObjects.Graphics;
  private panelG: Phaser.GameObjects.Graphics;
  private blocker: Phaser.GameObjects.Zone;

  private btns: Phaser.GameObjects.GameObject[] = [];
  private open = false;

  constructor(cfg: CreditsModalCfg) {
    super(cfg.scene, 0, 0);

    this.sceneRef = cfg.scene;

    const scene = cfg.scene;

    const depth = cfg.depth ?? 2000;

    const BTN = cfg.btnSize ?? 96;
    const GAP = cfg.gap ?? 18;
    const ROW_GAP = cfg.rowGap ?? 26;
    const R = cfg.radius ?? 16;

    const panelPad = cfg.panelPad ?? 24;
    const backdropAlpha = cfg.backdropAlpha ?? 0.62;

    const closeInset = cfg.closeInset ?? 6;
    const closeFontMul = cfg.closeFontMul ?? 0.6;
    const closeGapBelow = cfg.closeGapBelow ?? 30;

    this.setDepth(depth);
    this.setScrollFactor(0);

    const w = scene.scale.width;
    const h = scene.scale.height;

    this.bgG = scene.add.graphics().setDepth(depth).setScrollFactor(0);

    this.blocker = scene.add
      .zone(w / 2, h / 2, w, h)
      .setDepth(depth + 1)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.panelG = scene.add.graphics().setDepth(depth + 2).setScrollFactor(0);

    this.add(this.bgG);
    this.add(this.blocker);
    this.add(this.panelG);

    const fitIconTo = (img: Phaser.GameObjects.Image, maxPx: number) => {
      const maxDim = Math.max(img.width, img.height);
      img.setScale(maxPx / maxDim);
    };

    const drawSquare = (
      g: Phaser.GameObjects.Graphics,
      cx: number,
      cy: number,
      w: number,
      h: number,
      hovered: boolean,
      enabled: boolean
    ) => {
      g.clear();

      const hov = enabled ? hovered : false;

      const a = enabled ? (hov ? 0.56 : 0.44) : 0.32;
      const la = enabled ? (hov ? 0.40 : 0.28) : 0.16;

      g.fillStyle(0x000000, a);
      g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, R);

      g.lineStyle(2, 0xffffff, la);
      g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, R);
    };

    const makeSquareButton = (x: number, y: number, item: CreditLink) => {
      const enabled = !!item.url;

      const bg = scene.add.graphics().setDepth(depth + 3).setScrollFactor(0);

      const zone = scene.add
        .zone(x, y, BTN, BTN)
        .setDepth(depth + 5)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: enabled });

      const icon = scene.add
        .image(x, y, item.iconKey)
        .setDepth(depth + 4)
        .setScrollFactor(0)
        .setTintFill(item.color)
        .setAlpha(enabled ? 0.85 : 0.78);

      fitIconTo(icon, Math.floor(BTN * 0.68));
      const baseScale = icon.scaleX;

      let hovered = false;
      const redraw = () => drawSquare(bg, x, y, BTN, BTN, hovered, enabled);
      redraw();

      if (enabled) {
        zone.on("pointerover", () => {
          hovered = true;
          redraw();

          scene.tweens.killTweensOf(icon);
          scene.tweens.add({
            targets: icon,
            scale: baseScale * 1.08,
            alpha: 1.0,
            duration: 120,
            ease: "Sine.easeOut"
          });
        });

        zone.on("pointerout", () => {
          hovered = false;
          redraw();

          scene.tweens.killTweensOf(icon);
          scene.tweens.add({
            targets: icon,
            scale: baseScale,
            alpha: 0.85,
            duration: 120,
            ease: "Sine.easeOut"
          });
        });

        zone.on("pointerdown", () => {
          const url = item.url!;
          try {
            window.open(url, "_blank", "noopener,noreferrer");
          } catch {
            window.location.href = url;
          }
        });
      }

      this.add(bg);
      this.add(zone);
      this.add(icon);

      this.btns.push(bg, zone, icon);
    };

    const rows = cfg.rows ?? [];

    const maxRowWidth = Math.max(
      ...rows.map((r) => (r.length <= 0 ? 0 : r.length * BTN + Math.max(0, r.length - 1) * GAP)),
      BTN
    );

    const gridH =
      rows.length <= 0 ? 0 : rows.length * BTN + Math.max(0, rows.length - 1) * (GAP + ROW_GAP);

    const closeHit = Math.round(BTN * 0.5);
    const reservedTop = closeHit + closeGapBelow;

    const panelW = maxRowWidth + panelPad * 2;
    const panelH = reservedTop + gridH + panelPad;

    const panelX = w / 2;
    const panelY = h / 2;

    const panelLeft = panelX - panelW / 2;
    const panelTop = panelY - panelH / 2;

    this.bgG.fillStyle(0x000000, backdropAlpha).fillRect(0, 0, w, h);

    this.panelG.fillStyle(0x000000, 0.58);
    this.panelG.fillRoundedRect(panelLeft, panelTop, panelW, panelH, R + 6);
    this.panelG.lineStyle(2, 0xffffff, 0.28);
    this.panelG.strokeRoundedRect(panelLeft, panelTop, panelW, panelH, R + 6);

    const closeX = panelLeft + panelW - closeInset;
    const closeY = panelTop + closeInset;

    const closeZone = scene.add
      .zone(closeX, closeY, closeHit, closeHit)
      .setOrigin(1, 0)
      .setDepth(depth + 8)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const closeText = scene.add
      .text(closeX - closeHit / 2, closeY + closeHit / 2, "X", {
        fontFamily: "Arial",
        fontSize: `${Math.round(closeHit * closeFontMul)}px`,
        color: "#ffffff"
      })
      .setOrigin(0.5)
      .setDepth(depth + 9)
      .setScrollFactor(0)
      .setAlpha(0.8);

    closeZone.on("pointerover", () => {
      scene.tweens.killTweensOf(closeText);
      scene.tweens.add({
        targets: closeText,
        alpha: 1,
        scale: 1.1,
        duration: 120,
        ease: "Sine.easeOut"
      });
    });

    closeZone.on("pointerout", () => {
      scene.tweens.killTweensOf(closeText);
      scene.tweens.add({
        targets: closeText,
        alpha: 0.8,
        scale: 1,
        duration: 120,
        ease: "Sine.easeOut"
      });
    });

    closeZone.on("pointerdown", () => this.hide());

    this.add(closeZone);
    this.add(closeText);
    this.btns.push(closeZone, closeText);

    let y = panelTop + reservedTop + BTN / 2;
    const xStart = panelLeft + panelPad + BTN / 2;

    rows.forEach((row) => {
      let x = xStart;
      row.forEach((item) => {
        makeSquareButton(x, y, item);
        x += BTN + GAP;
      });
      y += BTN + GAP + ROW_GAP;
    });

    this.blocker.on("pointerdown", () => this.hide());

    this.setVisible(false);
    this.setAlpha(0);
    this.setScale(0.985);

    scene.add.existing(this);
  }

  isOpen(): boolean {
    return this.open;
  }

  show(): void {
    if (this.open) return;
    this.open = true;

    this.setVisible(true);

    const s = this.sceneRef;
    if (!s?.tweens) return;

    s.tweens.killTweensOf(this);
    s.tweens.add({
      targets: this,
      alpha: 1,
      scale: 1,
      duration: 140,
      ease: "Sine.easeOut"
    });
  }

  hide(): void {
    if (!this.open) return;
    this.open = false;

    const s = this.sceneRef;
    if (!s?.tweens) {
      this.setVisible(false);
      return;
    }

    s.tweens.killTweensOf(this);
    s.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.985,
      duration: 140,
      ease: "Sine.easeIn",
      onComplete: () => this.setVisible(false)
    });
  }

  override destroy(fromScene?: boolean): void {
    const s = this.sceneRef;

    if (s?.tweens) {
      s.tweens.killTweensOf(this);
      this.btns.forEach((b) => s.tweens.killTweensOf(b));
    }

    this.btns.forEach((b) => b.destroy());
    this.btns = [];

    this.blocker.destroy();
    this.panelG.destroy();
    this.bgG.destroy();

    super.destroy(fromScene);
  }
}
