import Phaser from "phaser";

type AbacusPointsCfg = {
  x: number;
  y: number;
  getPoints: () => number;
  maxPoints?: number;
  width?: number;
  rowGap?: number;
  beadR?: number;
};

type Row = {
  y: number;
  beads: Phaser.GameObjects.Container[];
  activeX: number[];
  inactiveX: number[];
  baseCol: number;
};

export default class AbacusPoints extends Phaser.GameObjects.Container {
  private getPoints: () => number;
  private maxPoints: number;

  private wi: number;
  private rowGap: number;
  private beadR: number;

  private frameG: Phaser.GameObjects.Graphics;
  private rows: Row[] = [];

  private lastPts = -1;

  constructor(scene: Phaser.Scene, cfg: AbacusPointsCfg) {
    super(scene, cfg.x, cfg.y);

    this.getPoints = cfg.getPoints;
    this.maxPoints = cfg.maxPoints ?? 1000;

    this.wi = cfg.width ?? 320;
    this.rowGap = cfg.rowGap ?? 54;
    this.beadR = cfg.beadR ?? 9;

    this.frameG = scene.add.graphics();
    this.add(this.frameG);

    const yThousands = -this.rowGap * 1.5;
    const yHundreds = -this.rowGap * 0.5;
    const yTens = this.rowGap * 0.5;
    const yOnes = this.rowGap * 1.5;

    const colThousands = 0xb0b0b0;
    const colHundreds = 0x9e9e9e;
    const colTens = 0x7f7f7f;
    const colOnes = 0x5f5f5f;

    this.rows = [
      this.makeRow(yThousands, colThousands),
      this.makeRow(yHundreds, colHundreds),
      this.makeRow(yTens, colTens),
      this.makeRow(yOnes, colOnes)
    ];

    for (const r of this.rows) {
      for (const b of r.beads) this.add(b);
    }

    this.setScrollFactor(0);
    this.setDepth(5000);

    scene.add.existing(this);

    this.redrawFrame();
    this.refresh(true);

    scene.scale.on("resize", () => {
      this.redrawFrame();
      this.refresh(true);
    });
  }

  private makeRow(y: number, baseCol: number): Row {
    const beads: Phaser.GameObjects.Container[] = [];

    const count = 10;

    const padX = 20;
    const leftX = -this.wi / 2 + padX;
    const rightX = this.wi / 2 - padX;

    const railLen = rightX - leftX;

    const inactiveStart = leftX + this.beadR;
    const inactiveEnd = leftX + railLen * 0.48 - this.beadR;

    const activeStart = leftX + railLen * 0.52 + this.beadR;
    const activeEnd = rightX - this.beadR;

    const inactiveX: number[] = [];
    const activeX: number[] = [];

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      inactiveX.push(Phaser.Math.Linear(inactiveStart, inactiveEnd, t));
      activeX.push(Phaser.Math.Linear(activeStart, activeEnd, t));
    }

    for (let i = 0; i < count; i++) {
      const bead = this.makeBead(inactiveX[i], y, baseCol);
      beads.push(bead);
    }

    return { y, beads, activeX, inactiveX, baseCol };
  }

  private makeBead(x: number, y: number, baseCol: number) {
    const c = this.scene.add.container(x, y);

    const r = this.beadR;

    const shadow = this.scene.add.circle(r * 0.22, r * 0.22, r, 0x000000, 0.18);

    const body = this.scene.add.circle(0, 0, r, baseCol, 1);
    body.setStrokeStyle(2, 0x000000, 0.55);

    c.add([shadow, body]);
    return c;
  }

  private redrawFrame() {
    this.frameG.clear();

    const x0 = -this.wi / 2;
    const x1 = this.wi / 2;

    const topRowY = this.rows[0].y;
    const botRowY = this.rows[this.rows.length - 1].y;

    const top = topRowY - (this.beadR + 26);
    const bot = botRowY + (this.beadR + 26);

    this.frameG.lineStyle(3, 0xffffff, 0.22);
    this.frameG.strokeRoundedRect(x0, top, this.wi, bot - top, 18);

    this.frameG.lineStyle(4, 0xffffff, 0.18);
    for (const r of this.rows) {
      this.frameG.beginPath();
      this.frameG.moveTo(x0 + 18, r.y);
      this.frameG.lineTo(x1 - 18, r.y);
      this.frameG.strokePath();
    }

    const midX = 0;
    this.frameG.lineStyle(4, 0xffffff, 0.12);
    this.frameG.beginPath();
    this.frameG.moveTo(midX, top + 14);
    this.frameG.lineTo(midX, bot - 14);
    this.frameG.strokePath();
  }

  public refresh(force = false) {
    const raw = Math.max(0, Math.floor(this.getPoints()));
    const pts = Math.min(this.maxPoints, raw);

    if (!force && pts === this.lastPts) return;
    this.lastPts = pts;

    const thousands = Math.floor(pts / 1000);
    const hundreds = Math.floor(pts / 100) % 10;
    const tens = Math.floor(pts / 10) % 10;
    const ones = pts % 10;

    this.applyRow(this.rows[0], thousands);
    this.applyRow(this.rows[1], hundreds);
    this.applyRow(this.rows[2], tens);
    this.applyRow(this.rows[3], ones);
  }

  private applyRow(row: Row, countOnRight: number) {
    for (let i = 0; i < row.beads.length; i++) {
      const bead = row.beads[i];
      bead.x = i < countOnRight ? row.activeX[i] : row.inactiveX[i];
      bead.y = row.y;
    }
  }
}
