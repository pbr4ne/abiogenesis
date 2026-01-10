import Phaser from "phaser";
import { LifeFormDef, LifeFormInstance } from "./EvolutionTypes";
import PlanetRunState from "../../planet/PlanetRunState";
import { getRun } from "../../utilities/GameSession";

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
  costG: Phaser.GameObjects.Graphics;
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
  private onPointsChanged: (() => void) | null = null;

  private biomeIcons: Record<"sea" | "land" | "air", Phaser.GameObjects.Image>;

  private clickLock: Record<StatKey, boolean> = {
    mutation: false,
    reproduction: false,
    survival: false
  };

  private plusHover: Record<StatKey, boolean> = {
    mutation: false,
    reproduction: false,
    survival: false
  };

  private holdTimers: Partial<Record<StatKey, Phaser.Time.TimerEvent>> = {};
  private holding: Record<StatKey, boolean> = {
    mutation: false,
    reproduction: false,
    survival: false
  };

  private readonly HOLD_INITIAL_DELAY_MS = 260;
  private readonly HOLD_REPEAT_MS = 70;

  private onGlobalPointerUp: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    const sw = scene.scale.width;
    const sh = scene.scale.height;

    this.backdrop = scene.add.rectangle(0, 0, sw, sh, 0x000000, 0.55).setOrigin(0, 0);
    this.backdrop.setInteractive({ useHandCursor: false });
    this.backdrop.on("pointerover", () => this.scene.input.setDefaultCursor("default"));

    const w = Math.min(1180, sw - 60);
    const h = Math.min(720, sh - 60);

    const cx = sw / 2;
    const cy = sh / 2;

    this.panel = scene.add.rectangle(cx, cy, w, h, 0x0b0b0b, 0.96);
    this.panel.setStrokeStyle(3, 0xffffff, 0.25);

    this.panel.setInteractive({ useHandCursor: false });
    this.panel.on("pointerover", () => this.scene.input.setDefaultCursor("default"));
    this.panel.on("pointerdown", (p: Phaser.Input.Pointer) => p.event.stopPropagation());

    const pad = 28;

    const closeW = 68;
    const closeH = 60;
    const closeX = cx + w / 2 - pad - closeW / 2;
    const closeY = cy - h / 2 + pad + closeH / 2 - 6;

    this.closeHit = scene.add.rectangle(closeX, closeY, closeW, closeH, 0x000000, 0);
    this.closeHit.setInteractive({ useHandCursor: true });

    this.closeText = scene.add.text(closeX, closeY, "✕", {
      fontFamily: "Arial",
      fontSize: "44px",
      color: "#ffffff"
    }).setOrigin(0.5, 0.5);

    const leftColX = cx - w / 2 + pad;

    const bigSize = 280;
    const bigIconOffsetX = 64;

    this.bigIcon = scene.add.image(
      leftColX + bigSize / 2 + bigIconOffsetX,
      cy - 50,
      "prokaryote"
    );

    this.bigIcon.setDisplaySize(bigSize, bigSize);

    this.bigIconBorder = scene.add.rectangle(this.bigIcon.x, this.bigIcon.y, bigSize + 114, bigSize + 114, 0x000000, 0x000000);
    this.bigIconBorder.setStrokeStyle(3, 0xffffff, 0.25);

    const biomeSize = 64;
    const biomeGap = 18;

    const biomeY = this.bigIcon.y + bigSize / 2 + 122;
    const biomeCx = this.bigIcon.x;

    const sea = scene.add.image(biomeCx - (biomeSize + biomeGap), biomeY, "sea").setDisplaySize(biomeSize, biomeSize);
    const land = scene.add.image(biomeCx, biomeY, "land").setDisplaySize(biomeSize, biomeSize);
    const air = scene.add.image(biomeCx + (biomeSize + biomeGap), biomeY, "air").setDisplaySize(biomeSize, biomeSize);

    this.biomeIcons = { sea, land, air };

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
      this.biomeIcons.sea,
      this.biomeIcons.land,
      this.biomeIcons.air,

      this.rows.mutation.left,
      this.rows.mutation.mid,
      this.rows.mutation.right,
      this.rows.mutation.barBg,
      this.rows.mutation.barFill,
      this.rows.mutation.ticks,
      this.rows.mutation.plus,
      this.rows.mutation.costG,

      this.rows.reproduction.left,
      this.rows.reproduction.mid,
      this.rows.reproduction.right,
      this.rows.reproduction.barBg,
      this.rows.reproduction.barFill,
      this.rows.reproduction.ticks,
      this.rows.reproduction.plus,
      this.rows.reproduction.costG,

      this.rows.survival.left,
      this.rows.survival.mid,
      this.rows.survival.right,
      this.rows.survival.barBg,
      this.rows.survival.barFill,
      this.rows.survival.ticks,
      this.rows.survival.plus,
      this.rows.survival.costG,

      this.closeHit,
      this.closeText
    ]);

    this.setScrollFactor(0);
    this.setDepth(30000);
    this.setVisible(false);

    this.backdrop.on("pointerdown", (p: Phaser.Input.Pointer) => {
      const left = cx - this.panel.width / 2;
      const right = cx + this.panel.width / 2;
      const top = cy - this.panel.height / 2;
      const bot = cy + this.panel.height / 2;

      const inside = p.x >= left && p.x <= right && p.y >= top && p.y <= bot;
      if (!inside) this.hide();
    });

    this.closeHit.on("pointerdown", (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.hide();
    });

    scene.add.existing(this);

    this.onPointsChanged = () => {
      if (!this.visible) return;
      const cur = this.current;
      if (!cur) return;
      const tint = rgbToHex(cur.def.colour.r, cur.def.colour.g, cur.def.colour.b);
      this.applyRow("mutation", cur.def, cur.lf, tint);
      this.applyRow("reproduction", cur.def, cur.lf, tint);
      this.applyRow("survival", cur.def, cur.lf, tint);
    };

    this.scene.events.on("evoPoints:changed", this.onPointsChanged);

    this.onGlobalPointerUp = () => this.stopAllHolds();
    this.scene.input.on("pointerup", this.onGlobalPointerUp);

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.onPointsChanged) this.scene?.events?.off("evoPoints:changed", this.onPointsChanged);
      this.onPointsChanged = null;

      if (this.onGlobalPointerUp) this.scene?.input?.off("pointerup", this.onGlobalPointerUp);
      this.onGlobalPointerUp = null;

      this.stopAllHolds();
    });
  }

  private getRun(): PlanetRunState | null {
    const run = getRun();
    return run ?? null;
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

  private supportsBiome(def: LifeFormDef, biome: "sea" | "land" | "air") {
    const d: any = def as any;

    const arr: any =
      d.biomes ??
      d.biomeTypes ??
      d.habitats ??
      d.environments ??
      d.biome ??
      d.habitat;

    if (Array.isArray(arr)) return arr.includes(biome);
    if (typeof arr === "string") return arr === biome;

    return false;
  }

  private applyBiomeIcons(def: LifeFormDef, tint: number) {
    for (const biome of ["sea", "land", "air"] as const) {
      const ok = this.supportsBiome(def, biome);

      this.biomeIcons[biome].clearTint();
      this.biomeIcons[biome].setTintFill(tint);

      this.biomeIcons[biome].setAlpha(ok ? 1 : 0.18);
    }
  }

  private getStat(lf: LifeFormInstance, key: StatKey) {
    const v =
      key === "mutation" ? lf.mutationRate :
        key === "reproduction" ? lf.reproductionRate :
          lf.survivalRate;

    return Phaser.Math.Clamp(v, 0, LifeDetailsModal.STAT_MAX);
  }

  private setStat(lf: LifeFormInstance, key: StatKey, v: number) {
    const vv = Phaser.Math.Clamp(v, 0, LifeDetailsModal.STAT_MAX);

    if (key === "mutation") lf.mutationRate = vv;
    else if (key === "reproduction") lf.reproductionRate = vv;
    else lf.survivalRate = vv;
  }

  private makeStatRow(scene: Phaser.Scene, x: number, topY: number, rowH: number): StatRow {
    const iconSize = 74;
    const gap = 20;

    const cy = topY + rowH / 2;

    const left = scene.add.image(x + iconSize / 2, cy, "life_form").setDisplaySize(iconSize, iconSize);
    const mid = scene.add.image(x + iconSize * 1.5 + gap, cy, "arrow").setDisplaySize(iconSize, iconSize);
    const right = scene.add.image(x + iconSize * 2.5 + gap * 2, cy, "life_form_mutated").setDisplaySize(iconSize, iconSize);

    const barX = x + iconSize * 3.5 + gap * 3 - 30;
    const barW = 220;
    const barH = 25;

    const barBg = scene.add.rectangle(barX + barW / 2, cy, barW, barH, 0x1a1a1a, 1);
    barBg.setStrokeStyle(2, 0xffffff, 0.2);

    const barFill = scene.add.rectangle(barX + 2, cy, 0, barH - 4, 0xffffff, 1);
    barFill.setOrigin(0, 0.5);

    const ticks = scene.add.graphics();

    const plusX = barX + barW + 24 + LifeDetailsModal.PLUS_SIZE / 2;
    const plus = scene.add.image(plusX, cy, "plus").setDisplaySize(LifeDetailsModal.PLUS_SIZE, LifeDetailsModal.PLUS_SIZE);

    const costG = scene.add.graphics();
    costG.setPosition(plusX + 78, cy);
    costG.setDepth(10001);
    costG.setVisible(false);

    return { left, mid, right, barBg, barFill, ticks, plus, costG, barW, barX, barH };
  }

  private drawCostDots(
    g: Phaser.GameObjects.Graphics,
    cost: number,
    tint: number,
    alpha: number
  ) {
    g.clear();

    const total = LifeDetailsModal.STAT_MAX;
    const c = Phaser.Math.Clamp(cost, 0, total - 1);

    const dotR = 4.2;
    const gap = dotR * 2.55;
    const startX = -((total - 1) * gap) / 2;
    const y = 0;

    const contentW = (total - 1) * gap + dotR * 2;
    const contentH = dotR * 2;

    const padX = 10;
    const padY = 8;

    const boxW = contentW + padX * 2;
    const boxH = contentH + padY * 2;

    const boxX = -boxW / 2;
    const boxY = -boxH / 2;

    g.fillStyle(0x000000, 0.55 * alpha);
    g.fillRoundedRect(boxX, boxY, boxW, boxH, 10);

    g.lineStyle(2, tint, 0.55 * alpha);
    g.strokeRoundedRect(boxX, boxY, boxW, boxH, 10);

    const outlineW = 2;
    const outlineA = 0.85 * alpha;

    const filledA = 0.55 * alpha;
    const emptyA = 0.06 * alpha;

    for (let i = 0; i < total; i++) {
      const xx = startX + i * gap;
      const isFilled = i < c;

      if (isFilled) {
        g.fillStyle(tint, filledA);
        g.fillCircle(xx, y, dotR);
      } else {
        g.fillStyle(0xffffff, emptyA);
        g.fillCircle(xx, y, dotR);
      }

      g.lineStyle(outlineW, tint, outlineA);
      g.strokeCircle(xx, y, dotR);
    }
  }

  private getUpgradeCostForNextStep(nextStep: number) {
    const maxCost = LifeDetailsModal.STAT_MAX - 1;
    return Phaser.Math.Clamp(nextStep - 1, 0, maxCost);
  }

  private stopHold(key: StatKey) {
    this.holding[key] = false;

    const t = this.holdTimers[key];
    if (t) {
      t.remove(false);
      delete this.holdTimers[key];
    }

    this.clickLock[key] = false;
  }

  private stopAllHolds() {
    this.stopHold("mutation");
    this.stopHold("reproduction");
    this.stopHold("survival");
  }

  private tryUpgradeOnce(key: StatKey): boolean {
    if (this.clickLock[key]) return false;

    const cur = this.current;
    if (!cur) return false;

    const run = this.getRun();
    if (!run) return false;

    const curV = this.getStat(cur.lf, key);
    if (curV >= LifeDetailsModal.STAT_MAX) {
      this.scene.events.emit("evoPoints:changed");
      return false;
    }

    const nextStep = Math.floor(curV) + 1;
    const cost = this.getUpgradeCostForNextStep(nextStep);

    const available = run.getEvoPointsAvailable();
    if (available < cost) {
      this.scene.events.emit("evoPoints:changed");
      return false;
    }

    this.clickLock[key] = true;

    if (cost > 0 && !run.trySpendEvoPoints(cost)) {
      this.scene.events.emit("evoPoints:changed");
      this.clickLock[key] = false;
      return false;
    }

    this.setStat(cur.lf, key, curV + 1);

    const tint2 = rgbToHex(cur.def.colour.r, cur.def.colour.g, cur.def.colour.b);

    this.applyRow("mutation", cur.def, cur.lf, tint2);
    this.applyRow("reproduction", cur.def, cur.lf, tint2);
    this.applyRow("survival", cur.def, cur.lf, tint2);

    this.scene.events.emit("life:upgrade", { id: cur.lf.id, stat: key });
    this.scene.events.emit("evoPoints:changed");

    this.scene.time.delayedCall(0, () => {
      this.clickLock[key] = false;
    });

    return true;
  }

  private startHold(key: StatKey) {
    this.stopHold(key);
    this.holding[key] = true;

    const didFirst = this.tryUpgradeOnce(key);
    if (!didFirst) {
      this.stopHold(key);
      return;
    }

    this.scene.time.delayedCall(this.HOLD_INITIAL_DELAY_MS, () => {
      if (!this.holding[key]) return;

      this.holdTimers[key] = this.scene.time.addEvent({
        delay: this.HOLD_REPEAT_MS,
        loop: true,
        callback: () => {
          if (!this.holding[key]) {
            this.stopHold(key);
            return;
          }

          const ok = this.tryUpgradeOnce(key);
          if (!ok) {
            this.stopHold(key);
          }
        }
      });
    });
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
    this.applyBiomeIcons(def, tint);

    this.applyRow("mutation", def, lf, tint);
    this.applyRow("reproduction", def, lf, tint);
    this.applyRow("survival", def, lf, tint);

    this.setVisible(true);
  }

  public hide() {
    this.stopAllHolds();

    this.current = null;
    this.setVisible(false);
    for (const k of ["mutation", "reproduction", "survival"] as const) {
      this.rows[k].costG.setVisible(false);
    }

  }

  public isOpen() {
    return this.visible;
  }

  private applyRow(key: StatKey, def: LifeFormDef, lf: LifeFormInstance, tint: number) {
    const row = this.rows[key];

    const v = this.getStat(lf, key);
    const p01 = Phaser.Math.Clamp(v / LifeDetailsModal.STAT_MAX, 0, 1);

    const nextStep = Math.floor(v) + 1;
    const cost = this.getUpgradeCostForNextStep(nextStep);

    const mutationHasNext = (def.mutatesTo?.length ?? 0) > 0;

    //set to false to alpha/hide terminal mutation upgrades
    const allowTerminalMutation = true;

    const statMeaningful =
      key !== "mutation" || (mutationHasNext || allowTerminalMutation);

    const aMul = statMeaningful ? 1 : 0.28;

    if (key === "mutation") {
      row.left.setTexture("life_form").setTintFill(tint).setAlpha(aMul);
      row.mid.setTexture("arrow").setTintFill(tint).setAlpha(aMul);
      row.right.setTexture("life_form_mutated").setTintFill(tint).setAlpha(aMul);
    }

    if (key === "reproduction") {
      row.left.setTexture("life_form").setTintFill(tint).setAlpha(aMul);
      row.mid.setTexture("arrow").setTintFill(tint).setAlpha(aMul);
      row.right.setTexture("life_form_reproduced").setTintFill(tint).setAlpha(aMul);
    }

    if (key === "survival") {
      row.left.setTexture("life_form_heart").setTintFill(tint).setAlpha(aMul);
      row.mid.setTexture("arrow").setTintFill(tint).setAlpha(aMul);
      row.right.setTexture("life_form_hearts").setTintFill(tint).setAlpha(aMul);
    }

    const innerW = row.barW - 4;
    row.barFill.width = Math.max(0, Math.floor(innerW * p01));
    row.barFill.setFillStyle(tint, p01 > 0 ? 1 : 0);
    row.barFill.setAlpha(aMul);

    row.ticks.clear();
    row.ticks.setAlpha(1);
    row.ticks.lineStyle(4, tint, 0.35 * aMul);

    const y0 = row.barBg.y - row.barH / 2 + 2;
    const y1 = row.barBg.y + row.barH / 2 - 2;

    row.barBg.setStrokeStyle(4, tint, 0.9 * aMul);

    for (let i = 1; i < LifeDetailsModal.STAT_MAX; i++) {
      const x = (row.barX + 2) + (innerW * i) / LifeDetailsModal.STAT_MAX;
      row.ticks.beginPath();
      row.ticks.moveTo(x, y0);
      row.ticks.lineTo(x, y1);
      row.ticks.strokePath();
    }

    const canUpgradeStat = statMeaningful && v < LifeDetailsModal.STAT_MAX;

    if (!canUpgradeStat) {
      row.costG.setVisible(false);
    }

    const run = this.getRun();
    const available = run ? run.getEvoPointsAvailable() : 0;

    const canAfford = available >= cost;
    const canClick = canUpgradeStat && canAfford;

    row.plus.off("pointerover");
    row.plus.off("pointerout");
    row.plus.off("pointerdown");
    row.plus.off("pointerup");
    row.plus.off("pointerupoutside");
    row.plus.disableInteractive();

    row.plus.setTintFill(tint);
    row.plus.setAlpha((canClick ? 0.9 : 0.35) * aMul);
    row.plus.setDisplaySize(LifeDetailsModal.PLUS_SIZE, LifeDetailsModal.PLUS_SIZE);

    if (!canUpgradeStat) {
      row.costG.setVisible(false);
      this.plusHover[key] = false;
      this.stopHold(key);
      return;
    }

    row.plus.setInteractive({ useHandCursor: canClick });

    const basePlusAlpha = 0.9 * aMul;
    const hoverPlusAlpha = 1.0 * aMul;

    const showCost = () => {
      row.costG.setVisible(true);
      this.drawCostDots(row.costG, cost, tint, aMul);
    };

    const hideCost = () => {
      row.costG.setVisible(false);
    };

    const applyHoverVisuals = () => {
      showCost();

      if (canClick) {
        row.plus.setAlpha(hoverPlusAlpha);
        row.plus.setDisplaySize(LifeDetailsModal.PLUS_SIZE * 1.1, LifeDetailsModal.PLUS_SIZE * 1.1);
        this.scene.input.setDefaultCursor("pointer");
      } else {
        row.plus.setAlpha(0.35 * aMul);
        row.plus.setDisplaySize(LifeDetailsModal.PLUS_SIZE, LifeDetailsModal.PLUS_SIZE);
        this.scene.input.setDefaultCursor("default");
      }
    };

    const clearHoverVisuals = () => {
      hideCost();

      row.plus.setAlpha((canClick ? basePlusAlpha : 0.35 * aMul));
      row.plus.setDisplaySize(LifeDetailsModal.PLUS_SIZE, LifeDetailsModal.PLUS_SIZE);
      this.scene.input.setDefaultCursor("default");
    };

    row.plus.on("pointerover", () => {
      this.plusHover[key] = true;
      applyHoverVisuals();
    });

    row.plus.on("pointerout", () => {
      this.plusHover[key] = false;
      clearHoverVisuals();
      this.stopHold(key);
    });

    row.plus.on("pointerdown", (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();

      if (!canClick) return;

      this.startHold(key);
    });

    row.plus.on("pointerup", () => this.stopHold(key));
    row.plus.on("pointerupoutside", () => this.stopHold(key));

    if (this.plusHover[key]) {
      applyHoverVisuals();
    }
  }
}
