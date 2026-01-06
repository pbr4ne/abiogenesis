import Phaser from "phaser";

type FlaskPointsCfg = {
  x: number;
  y: number;

  getPoints: () => number;

  maxFillPoints?: number;

  maxShownNuggets?: number;

  displayW?: number;
  displayH?: number;
};

type Pt = { x: number; y: number };

export default class FlaskPoints extends Phaser.GameObjects.Container {
  private flask: Phaser.GameObjects.Image;

  private nuggetsG: Phaser.GameObjects.Graphics;

  private maskG: Phaser.GameObjects.Graphics;

  private getPoints: () => number;

  private lastPts = -1;

  private rng: Phaser.Math.RandomDataGenerator;

  private maxFillPoints: number;
  private maxShown: number;

  private nugR = 4.5;
  private minDist = this.nugR * 2.2;

  private nugPositions: Pt[] = [];

  private cavity = {
    topY: 0.19,
    botY: 0.93,
    topLeftX: 0.41,
    topRightX: 0.59,
    botLeftX: 0.17,
    botRightX: 0.83
  };

  constructor(scene: Phaser.Scene, cfg: FlaskPointsCfg) {
    super(scene, cfg.x, cfg.y);

    this.getPoints = cfg.getPoints;

    this.maxFillPoints = cfg.maxFillPoints ?? 60;
    this.maxShown = cfg.maxShownNuggets ?? 140;

    const seed = String((scene.registry.get("run") as any)?.seed ?? "seed");
    this.rng = new Phaser.Math.RandomDataGenerator([seed, "flaskPoints"]);

    this.flask = scene.add.image(0, 0, "flask").setOrigin(0.5, 0.5);
    this.flask.setScrollFactor(0);

    const dw = cfg.displayW ?? 260;
    const dh = cfg.displayH ?? 260;
    this.flask.setDisplaySize(dw, dh);

    this.flask.setTintFill(0x808080);

    this.nuggetsG = scene.add.graphics();

    this.maskG = scene.add.graphics();
    this.maskG.setScrollFactor(0);
    this.maskG.setAlpha(0.0001);
    this.add(this.maskG);


    this.flask.setDepth(3);
    this.nuggetsG.setDepth(2);

    this.add([this.nuggetsG, this.flask]);

    this.setScrollFactor(0);
    this.setDepth(5000);

    scene.add.existing(this);

    this.redrawMask();
    this.refresh(true);
  }

  private clamp01(v: number) {
    return Math.max(0, Math.min(1, v));
  }

  private getCavityPx() {
    const w = this.flask.displayWidth;
    const h = this.flask.displayHeight;

    const topY = -h / 2 + this.cavity.topY * h;
    const botY = -h / 2 + this.cavity.botY * h;

    const topLX = -w / 2 + this.cavity.topLeftX * w;
    const topRX = -w / 2 + this.cavity.topRightX * w;

    const botLX = -w / 2 + this.cavity.botLeftX * w;
    const botRX = -w / 2 + this.cavity.botRightX * w;

    return { topY, botY, topLX, topRX, botLX, botRX };
  }

  private redrawMask() {
    this.maskG.clear();

    const { topY, botY, topLX, topRX, botLX, botRX } = this.getCavityPx();

    const inset = 5;

    this.maskG.fillStyle(0xffffff, 1);
    this.maskG.beginPath();
    this.maskG.moveTo(topLX + inset, topY + inset);
    this.maskG.lineTo(topRX - inset, topY + inset);
    this.maskG.lineTo(botRX - inset, botY - inset);
    this.maskG.lineTo(botLX + inset, botY - inset);
    this.maskG.closePath();
    this.maskG.fillPath();
  }

  private liquidTopYForPoints(pts: number) {
    const { topY, botY } = this.getCavityPx();
    const p = Math.max(0, Math.min(this.maxFillPoints, pts));
    const level01 = this.clamp01(p / this.maxFillPoints);
    return Phaser.Math.Linear(botY, topY, level01);
  }

  private xRangeAtY(y: number) {
    const { topY, botY, topLX, topRX, botLX, botRX } = this.getCavityPx();
    const t = this.clamp01((y - topY) / Math.max(1, (botY - topY)));

    const lx = Phaser.Math.Linear(topLX, botLX, t);
    const rx = Phaser.Math.Linear(topRX, botRX, t);

    const pad = 8;
    return { lx: lx + pad, rx: rx - pad };
  }

  private tryPlaceNuggetForIndex(idx: number) {
    const ptsForThis = Math.min(this.maxFillPoints, idx + 1);
    const liquidTopY = this.liquidTopYForPoints(ptsForThis);

    const { botY } = this.getCavityPx();

    const yMin = liquidTopY + this.nugR + 2;
    const yMax = botY - this.nugR - 0;


    for (let tries = 0; tries < 160; tries++) {
      const y = Phaser.Math.Linear(yMax, yMin, Math.pow(this.rng.frac(), 1.8));

      const { lx, rx } = this.xRangeAtY(y);
      if (rx - lx < this.nugR * 3) continue;

      const x = Phaser.Math.FloatBetween(lx + this.nugR, rx - this.nugR);

      let ok = true;
      for (const p of this.nugPositions) {
        const dx = x - p.x;
        const dy = y - p.y;
        if (dx * dx + dy * dy < this.minDist * this.minDist) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      this.nugPositions.push({ x, y });
      return true;
    }

    return false;
  }

  private redrawLiquidAndNuggets(pts: number) {
    const cappedPts = Math.max(0, Math.min(this.maxFillPoints, pts));
    const nugCount = Math.min(Math.max(0, pts), this.maxShown);

    const { topY, botY } = this.getCavityPx();
    const liquidTopY = this.liquidTopYForPoints(cappedPts);

    this.nuggetsG.clear();
    this.nuggetsG.fillStyle(0xffffff, 0.88);
    this.nuggetsG.lineStyle(2, 0xffffff, 0.22);

    for (let i = 0; i < Math.min(nugCount, this.nugPositions.length); i++) {
      const p = this.nugPositions[i];

      if (p.y < liquidTopY + this.nugR) continue;
      if (p.y < topY || p.y > botY) continue;

      this.nuggetsG.fillCircle(p.x, p.y, this.nugR);
      this.nuggetsG.strokeCircle(p.x, p.y, this.nugR);
    }
  }

  public refresh(force = false) {
    const ptsF = Math.max(0, this.getPoints());
    const ptsI = Math.floor(ptsF);

    if (!force && ptsI === this.lastPts) {
      this.redrawLiquidAndNuggets(ptsF);
      return;
    }

    const want = Math.min(ptsI, this.maxShown);

    if (want < this.nugPositions.length) {
      this.nugPositions.length = want;
    } else if (want > this.nugPositions.length) {
      while (this.nugPositions.length < want) {
        const ok = this.tryPlaceNuggetForIndex(this.nugPositions.length);
        if (!ok) break;
      }
    }

    this.lastPts = ptsI;
    this.redrawLiquidAndNuggets(ptsF);
  }
}
