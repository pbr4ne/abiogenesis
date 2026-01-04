import Phaser from "phaser";
import { LifeFormDef, LifeFormInstance } from "./EvolutionTypes";

export type LifeHoverPayload = { lf: LifeFormInstance; def: LifeFormDef } | null;

type StatKey = "mutation" | "reproduction" | "survival";

type StatRow = {
  left: Phaser.GameObjects.Image;
  mid: Phaser.GameObjects.Image;
  right: Phaser.GameObjects.Image;
  barBg: Phaser.GameObjects.Rectangle;
  barFill: Phaser.GameObjects.Rectangle;
  ticks: Phaser.GameObjects.Graphics;
  plus: Phaser.GameObjects.Image;
  barW: number;
  barX: number;
  barH: number;
};

const rgbToHex = (r: number, g: number, b: number) => (r << 16) | (g << 8) | b;

export default class LifeDetailsModal extends Phaser.GameObjects.Container {
  private backdrop: Phaser.GameObjects.Rectangle;
  private panel: Phaser.GameObjects.Rectangle;
  private closeHit: Phaser.GameObjects.Rectangle;
  private closeText: Phaser.GameObjects.Text;

  private bigIcon: Phaser.GameObjects.Image;
  private bigIconBorder: Phaser.GameObjects.Rectangle;

  private rows: Record<StatKey, StatRow>;

  private current: LifeHoverPayload = null;
  private static readonly STAT_MAX = 5;
  private static readonly PLUS_SIZE = 50;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    const sw = scene.scale.width;
    const sh = scene.scale.height;

    this.backdrop = scene.add.rectangle(0, 0, sw, sh, 0x000000, 0.55).setOrigin(0, 0);
    this.backdrop.setInteractive();

    const w = Math.min(1180, sw - 60);
    const h = Math.min(720, sh - 60);

    const cx = sw / 2;
    const cy = sh / 2;

    this.panel = scene.add.rectangle(cx, cy, w, h, 0x0b0b0b, 0.96);
    this.panel.setStrokeStyle(3, 0xffffff, 0.25);

    const pad = 28;

    const closeW = 44;
    const closeH = 36;
    const closeX = cx + w / 2 - pad - closeW / 2;
    const closeY = cy - h / 2 + pad + closeH / 2 - 4;

    this.closeHit = scene.add.rectangle(closeX, closeY, closeW, closeH, 0x000000, 0);
    this.closeHit.setInteractive({ useHandCursor: true });

    this.closeText = scene.add.text(closeX, closeY, "✕", {
      fontFamily: "Arial",
      fontSize: "26px",
      color: "#ffffff"
    }).setOrigin(0.5, 0.5);

    const leftColX = cx - w / 2 + pad;

    const bigSize = 280;
    const bigIconOffsetX = 64;

    this.bigIcon = scene.add.image(
      leftColX + bigSize / 2 + bigIconOffsetX,
      cy,
      "prokaryote"
    );

    this.bigIcon.setDisplaySize(bigSize, bigSize);

    this.bigIconBorder = scene.add.rectangle(this.bigIcon.x, this.bigIcon.y, bigSize + 114, bigSize + 114, 0x000000, 0);
    this.bigIconBorder.setStrokeStyle(3, 0xffffff, 0.25);

    const rightPad = 34;
    const rightColX = cx + w / 2 - rightPad - 660;

    const rowH = 112;
    const rowGap = 28;

    const groupH = rowH * 3 + rowGap * 2;
    const groupTopY = cy - groupH / 2;

    this.rows = {
      mutation: this.makeStatRow(scene, rightColX, groupTopY + 0 * (rowH + rowGap), rowH),
      reproduction: this.makeStatRow(scene, rightColX, groupTopY + 1 * (rowH + rowGap), rowH),
      survival: this.makeStatRow(scene, rightColX, groupTopY + 2 * (rowH + rowGap), rowH)
    };

    this.add([
      this.backdrop,
      this.panel,
      this.bigIconBorder,
      this.bigIcon,

      this.rows.mutation.left,
      this.rows.mutation.mid,
      this.rows.mutation.right,
      this.rows.mutation.barBg,
      this.rows.mutation.barFill,
      this.rows.mutation.ticks,
      this.rows.mutation.plus,

      this.rows.reproduction.left,
      this.rows.reproduction.mid,
      this.rows.reproduction.right,
      this.rows.reproduction.barBg,
      this.rows.reproduction.barFill,
      this.rows.reproduction.ticks,
      this.rows.reproduction.plus,

      this.rows.survival.left,
      this.rows.survival.mid,
      this.rows.survival.right,
      this.rows.survival.barBg,
      this.rows.survival.barFill,
      this.rows.survival.ticks,
      this.rows.survival.plus,

      this.closeHit,
      this.closeText
    ]);

    this.setScrollFactor(0);
    this.setDepth(10000);
    this.setVisible(false);

    this.backdrop.on("pointerdown", () => this.hide());
    this.closeHit.on("pointerdown", () => this.hide());

    scene.add.existing(this);
  }

  private lightenHex(hex: number, amt01: number) {
    const r = (hex >> 16) & 0xff;
    const g = (hex >> 8) & 0xff;
    const b = hex & 0xff;

    const rr = Phaser.Math.Clamp(Math.round(r + (255 - r) * amt01), 0, 255);
    const gg = Phaser.Math.Clamp(Math.round(g + (255 - g) * amt01), 0, 255);
    const bb = Phaser.Math.Clamp(Math.round(b + (255 - b) * amt01), 0, 255);

    return (rr << 16) | (gg << 8) | bb;
  }

  private getStat(lf: LifeFormInstance, key: StatKey) {
    return key === "mutation" ? lf.mutationRate :
      key === "reproduction" ? lf.reproductionRate :
        lf.survivalRate;
  }

  private setStat(lf: LifeFormInstance, key: StatKey, v: number) {
    if (key === "mutation") lf.mutationRate = v;
    else if (key === "reproduction") lf.reproductionRate = v;
    else lf.survivalRate = v;
  }

  private makeStatRow(scene: Phaser.Scene, x: number, topY: number, rowH: number): StatRow {
    const iconSize = 74;
    const gap = 20;

    const cy = topY + rowH / 2;

    const left = scene.add.image(x + iconSize / 2, cy, "life_form").setDisplaySize(iconSize, iconSize);
    const mid = scene.add.image(x + iconSize * 1.5 + gap, cy, "arrow").setDisplaySize(iconSize, iconSize);
    const right = scene.add.image(x + iconSize * 2.5 + gap * 2, cy, "life_form_mutated").setDisplaySize(iconSize, iconSize);

    let barX = x + iconSize * 3.5 + gap * 3 - 30;
    const barW = 220;
    const barH = 25;

    const barBg = scene.add.rectangle(barX + barW / 2, cy, barW, barH, 0x1a1a1a, 1);
    barBg.setStrokeStyle(2, 0xffffff, 0.2);


    const barFill = scene.add.rectangle(barX + 2, cy, 0, barH - 4, 0xffffff, 1);
    barFill.setOrigin(0, 0.5);

    const ticks = scene.add.graphics();

    const plus = scene.add.image(barX + barW + 24 + LifeDetailsModal.PLUS_SIZE / 2, cy, "plus").setDisplaySize(LifeDetailsModal.PLUS_SIZE, LifeDetailsModal.PLUS_SIZE);
    plus.setInteractive({ useHandCursor: true });

    return { left, mid, right, barBg, barFill, ticks, plus, barW, barX, barH };
  }

  public show(payload: LifeHoverPayload) {
    if (!payload) return;

    this.current = payload;

    const { lf, def } = payload;

    const tint = rgbToHex(def.colour.r, def.colour.g, def.colour.b);

    this.panel.setStrokeStyle(3, tint, 0.9);

    this.bigIcon.setTexture(def.type);
    this.bigIcon.setTintFill(tint);
    this.bigIconBorder.setStrokeStyle(3, tint, 0.9);

    this.applyRow("mutation", def, lf, tint);
    this.applyRow("reproduction", def, lf, tint);
    this.applyRow("survival", def, lf, tint);

    this.setVisible(true);
  }

  public hide() {
    this.current = null;
    this.setVisible(false);
  }

  public isOpen() {
    return this.visible;
  }

  private applyRow(key: StatKey, def: LifeFormDef, lf: LifeFormInstance, tint: number) {
    const row = this.rows[key];

    const v =
      key === "mutation" ? lf.mutationRate :
        key === "reproduction" ? lf.reproductionRate :
          lf.survivalRate;

    const p01 = Phaser.Math.Clamp(v / 5, 0, 1);

    row.left.setTexture("life_form").setTintFill(tint);
    row.plus.setTintFill(tint);

    if (key === "mutation") {
      row.left.setTexture("life_form").setTintFill(tint);
      row.plus.setTintFill(tint);
      row.mid.setTexture("arrow").setTintFill(tint);
      row.right.setTexture("life_form_mutated").setTintFill(tint);
    }

    if (key === "reproduction") {
      row.left.setTexture("life_form").setTintFill(tint);
      row.mid.setTexture("arrow").setTintFill(tint);
      row.right.setTexture("life_form_reproduced").setTintFill(tint);
    }

    if (key === "survival") {
      row.left.setTexture("life_form_heart").setTintFill(tint);
      row.mid.setTexture("arrow").setTintFill(tint);
      row.right.setTexture("life_form_hearts").setTintFill(tint);
    }

    const innerW = row.barW - 4;
    row.barFill.width = Math.max(0, Math.floor(innerW * p01));
    row.barFill.setFillStyle(tint, p01 > 0 ? 1 : 0);

    row.ticks.clear();
    row.ticks.lineStyle(4, tint, 0.35);

    const y0 = row.barBg.y - row.barH / 2 + 2;
    const y1 = row.barBg.y + row.barH / 2 - 2;

    row.barBg.setStrokeStyle(4, tint, 0.9);

    for (let i = 1; i < 5; i++) {
      const x = (row.barX + 2) + (innerW * i) / 5;
      row.ticks.beginPath();
      row.ticks.moveTo(x, y0);
      row.ticks.lineTo(x, y1);
      row.ticks.strokePath();
    }

    row.plus.off("pointerdown");
    row.plus.off("pointerover");
    row.plus.off("pointerout");

    const canUpgrade = v < LifeDetailsModal.STAT_MAX;

    row.plus.setAlpha(canUpgrade ? 0.9 : 0.25);
    row.plus.setDisplaySize(LifeDetailsModal.PLUS_SIZE, LifeDetailsModal.PLUS_SIZE);

    if (!canUpgrade) {
      row.plus.disableInteractive();
      return;
    }

    row.plus.setInteractive({ useHandCursor: true });

    const basePlusTint = tint;
    const hoverPlusTint = this.lightenHex(tint, 0.35);

    row.plus.on("pointerover", () => {
      row.plus.setTintFill(hoverPlusTint);
      row.plus.setAlpha(1);
      row.plus.setDisplaySize(LifeDetailsModal.PLUS_SIZE * 1.1, LifeDetailsModal.PLUS_SIZE * 1.1);
    });

    row.plus.on("pointerout", () => {
      row.plus.setTintFill(basePlusTint);
      row.plus.setAlpha(0.9);
      row.plus.setDisplaySize(LifeDetailsModal.PLUS_SIZE, LifeDetailsModal.PLUS_SIZE);
    });

    row.plus.on("pointerdown", () => {
      const cur = this.current;
      if (!cur) return;

      const curV = this.getStat(cur.lf, key);
      if (curV >= LifeDetailsModal.STAT_MAX) return;

      this.setStat(cur.lf, key, curV + 1);

      this.applyRow(key, cur.def, cur.lf, tint);

      this.scene.events.emit("life:upgrade", { id: cur.lf.id, stat: key });
    });
  }
}
