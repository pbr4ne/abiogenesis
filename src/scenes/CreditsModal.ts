import Phaser from "phaser";

export type CreditLink = {
  iconKey: string;
  url?: string;
  colour: number;
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

type SectionLayout = {
  startRow: number;
  rowCount: number;

  maxRowW: number;
  rowsH: number;

  xLeft: number;
  yTop: number;
  w: number;
  h: number;
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

    const SECTION_PAD = Math.round(BTN * 0.22);
    const SECTION_GAP = Math.round(ROW_GAP * 0.9);
    const SECTION_R = R + 10;

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
        .setTintFill(item.colour)
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

    const rowW = (row: CreditLink[]) =>
      row.length <= 0 ? 0 : row.length * BTN + Math.max(0, row.length - 1) * GAP;

    const sectionDefs = [
      { startRow: 0, rowCount: Math.min(1, rows.length) },
      { startRow: 1, rowCount: Math.max(0, Math.min(1, rows.length - 1)) },
      { startRow: 2, rowCount: Math.max(0, rows.length - 2) }
    ].filter((s) => s.rowCount > 0);

    const maxRowWidth = Math.max(...rows.map((r) => rowW(r)), BTN);

    const closeHit = Math.round(BTN * 0.5);
    const reservedTop = closeHit + closeGapBelow;

    const sectionLayouts: SectionLayout[] = [];

    let totalSectionsH = 0;
    sectionDefs.forEach((sd, i) => {
      let secMaxW = 0;
      for (let r = sd.startRow; r < sd.startRow + sd.rowCount; r++) {
        secMaxW = Math.max(secMaxW, rowW(rows[r] ?? []));
      }

      const rowsH =
        sd.rowCount <= 0
          ? 0
          : sd.rowCount * BTN + Math.max(0, sd.rowCount - 1) * (GAP + ROW_GAP);

      const secW = Math.max(secMaxW, BTN) + SECTION_PAD * 2;
      const secH = rowsH + SECTION_PAD * 2;

      sectionLayouts.push({
        startRow: sd.startRow,
        rowCount: sd.rowCount,
        maxRowW: secMaxW,
        rowsH,
        xLeft: 0,
        yTop: 0,
        w: secW,
        h: secH
      });

      totalSectionsH += secH;
      if (i < sectionDefs.length - 1) totalSectionsH += SECTION_GAP;
    });

    const maxSectionW = Math.max(...sectionLayouts.map((s) => s.w), maxRowWidth + SECTION_PAD * 2);

    const panelW = maxSectionW + panelPad * 2;
    const panelH = reservedTop + totalSectionsH + panelPad;


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

    const drawSectionBox = (layout: SectionLayout) => {
      const g = scene.add.graphics().setDepth(depth + 2).setScrollFactor(0);

      g.fillStyle(0x000000, 0.34);
      g.fillRoundedRect(layout.xLeft, layout.yTop, layout.w, layout.h, SECTION_R);

      g.lineStyle(2, 0xffffff, 0.20);
      g.strokeRoundedRect(layout.xLeft, layout.yTop, layout.w, layout.h, SECTION_R);

      this.add(g);
      this.btns.push(g);
      return g;
    };

    const drawHeartsInEmptySlot = (xStart: number, yStart: number) => {
      const icon = scene.add.image(0, 0, "hearts").setDepth(depth + 7).setScrollFactor(0);

      const maxH = Math.floor(BTN * 0.48);
      const maxDim = Math.max(icon.width, icon.height);
      icon.setScale(maxH / maxDim);

      const col = 5;
      const row = 1;

      const x = xStart + col * (BTN + GAP);
      const y = yStart + row * (BTN + GAP + ROW_GAP);

      icon.setPosition(x, y);
      icon.setTintFill(0xffffff);
      icon.setAlpha(0.20);

      this.add(icon);
      this.btns.push(icon);
    };

    let secY = panelTop + reservedTop;

    sectionLayouts.forEach((layout, si) => {
      const secLeft = panelLeft + panelPad;

      layout.xLeft = secLeft;
      layout.yTop = secY;
      layout.w = maxSectionW;

      drawSectionBox(layout);

      let y = layout.yTop + SECTION_PAD + BTN / 2;
      const xStart = layout.xLeft + SECTION_PAD + BTN / 2;

      if (si === 2) drawHeartsInEmptySlot(xStart, y);

      for (let r = layout.startRow; r < layout.startRow + layout.rowCount; r++) {
        let x = xStart;
        (rows[r] ?? []).forEach((item) => {
          makeSquareButton(x, y, item);
          x += BTN + GAP;
        });
        y += BTN + GAP + ROW_GAP;
      }

      secY += layout.h + SECTION_GAP;
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
