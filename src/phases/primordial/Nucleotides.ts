import Phaser from "phaser";
import SoupProgress from "./SoupProgress";

type NucKey = "A" | "G" | "T" | "C";

export default class Nucleotides extends Phaser.GameObjects.Container {
  private g: Phaser.GameObjects.Graphics;
  private progress: SoupProgress;

  constructor(scene: Phaser.Scene, x: number, y: number, progress: SoupProgress) {
    super(scene, x, y);
    this.progress = progress;

    this.g = scene.add.graphics();
    this.add(this.g);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.draw, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.draw, this);
    });
  }

  private draw() {
    const g = this.g;
    g.clear();

    const items: { key: NucKey; col: number }[] = [
      { key: "A", col: 0xff00ff },
      { key: "G", col: 0xffff00 },
      { key: "T", col: 0x00ff00 },
      { key: "C", col: 0x00ffff }
    ];

    const w = 320;
    const h = 155;
    const gap = 32;
    const yStart = -50;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const y = yStart + i * (h + gap);

      const raw = Phaser.Math.Clamp(this.progress.getFill01(it.key), 0, 1);
      const f = this.visualFill01(raw);
      this.drawNucleotide(g, 0, y, w, h, it.key, it.col, f);
    }
  }

  private drawNucleotide(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    key: NucKey,
    col: number,
    fill01: number
  ) {
    const isPurine = key === "A" || key === "G";

    const baseA = 0.10;
    const fillA = 0.78;

    const blackW = 12;
    const whiteW = 4;

    const cx = x + w * 0.56;
    const cy = y + h * 0.52;

    const hexR = Math.min(w, h) * 0.38;
    const hexRot = Math.PI / 6;

    if (!isPurine) {
      const hex = this.regPoly(cx, cy, hexR, 6, hexRot);

      const topIdx = this.topmostIndex(hex);
      const topLeftIdx = this.topLeftIndex(hex);
      const bottomRightIdx = this.bottomRightIndex(hex);

      g.fillStyle(0x0b0f14, baseA);
      this.fillPoly(g, hex);

      if (fill01 > 0) {
        const yCut = this.yCutForFill(hex, fill01);
        const clipped = this.clipPolyBottom(hex, yCut);
        if (clipped.length >= 3) {
          g.fillStyle(col, fillA);
          this.fillPoly(g, clipped);
        }
      }

      this.ribbonStrokePoly(g, hex, blackW, whiteW);

      const stubLen = 28;
      if (key === "T") {
        this.stubBW(g, hex, topIdx, stubLen);
        this.stubBW(g, hex, topLeftIdx, stubLen);
        this.stubBW(g, hex, bottomRightIdx, stubLen);
      }

      if (key === "C") {
        this.stubBW(g, hex, topIdx, stubLen);
        this.stubBW(g, hex, bottomRightIdx, stubLen);
      }

      return;
    }

    const hexC = new Phaser.Math.Vector2(cx, cy);
    const hex = this.regPoly(hexC.x, hexC.y, hexR, 6, hexRot);

    const vTop = hex[2];
    const vBot = hex[3];

    const pent = this.fusedRegularPentagon(hexC.x, hexC.y, vTop, vBot);

    g.fillStyle(0x0b0f14, baseA);
    this.fillPoly(g, hex);
    this.fillPoly(g, pent);

    if (fill01 > 0) {
      const yCut = this.yCutForFillMulti([hex, pent], fill01);

      const hexClip = this.clipPolyBottom(hex, yCut);
      if (hexClip.length >= 3) {
        g.fillStyle(col, fillA);
        this.fillPoly(g, hexClip);
      }

      const pentClip = this.clipPolyBottom(pent, yCut);
      if (pentClip.length >= 3) {
        g.fillStyle(col, fillA);
        this.fillPoly(g, pentClip);
      }
    }

    this.ribbonStrokePoly(g, hex, blackW, whiteW);
    this.ribbonStrokePoly(g, pent, blackW, whiteW);

    const stubLen = 28;

    const topIdx = this.topmostIndex(hex);
    const bottomRightIdx = this.bottomRightIndex(hex);

    if (key === "A") {
      this.stubBW(g, hex, topIdx, stubLen);
    }

    if (key === "G") {
      this.stubBW(g, hex, topIdx, stubLen);
      this.stubBW(g, hex, bottomRightIdx, stubLen);
    }
  }

  private visualFill01(raw01: number) {
    const f = Phaser.Math.Clamp(raw01, 0, 1);
    if (f <= 0) return 0;
    if (f >= 1) return 1;

    const minVis = 0.10;
    const maxVis = 0.90;

    return minVis + (maxVis - minVis) * f;
  }

  private yCutForFill(pts: Phaser.Math.Vector2[], fill01: number) {
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of pts) {
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const f = Phaser.Math.Clamp(fill01, 0, 1);
    return maxY - (maxY - minY) * f;
  }

  private yCutForFillMulti(polys: Phaser.Math.Vector2[][], fill01: number) {
    let minY = Infinity;
    let maxY = -Infinity;

    for (const pts of polys) {
      for (const p of pts) {
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }

    const f = Phaser.Math.Clamp(fill01, 0, 1);
    return maxY - (maxY - minY) * f;
  }

  private clipPolyBottom(pts: Phaser.Math.Vector2[], yCut: number): Phaser.Math.Vector2[] {
    if (pts.length < 3) return [];

    const inside = (p: Phaser.Math.Vector2) => p.y >= yCut;

    const intersect = (a: Phaser.Math.Vector2, b: Phaser.Math.Vector2) => {
      const dy = b.y - a.y;
      if (Math.abs(dy) < 0.000001) return new Phaser.Math.Vector2(b.x, yCut);

      const t = (yCut - a.y) / dy;
      const x = a.x + (b.x - a.x) * t;
      return new Phaser.Math.Vector2(x, yCut);
    };

    const out: Phaser.Math.Vector2[] = [];

    let s = pts[pts.length - 1];
    let sIn = inside(s);

    for (let i = 0; i < pts.length; i++) {
      const e = pts[i];
      const eIn = inside(e);

      if (sIn && eIn) {
        out.push(e);
      } else if (sIn && !eIn) {
        out.push(intersect(s, e));
      } else if (!sIn && eIn) {
        out.push(intersect(s, e));
        out.push(e);
      }

      s = e;
      sIn = eIn;
    }

    return out;
  }

  private topmostIndex(pts: Phaser.Math.Vector2[]) {
    let best = 0;
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].y < pts[best].y) best = i;
    }
    return best;
  }

  private topLeftIndex(pts: Phaser.Math.Vector2[]) {
    let cx = 0;
    let cy = 0;
    for (const p of pts) {
      cx += p.x;
      cy += p.y;
    }
    cx /= pts.length;
    cy /= pts.length;

    let best = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < pts.length; i++) {
      const dx = pts[i].x - cx;
      const dy = pts[i].y - cy;

      const score = (-dx * 2.2) + (-dy * 1.0);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }

    return best;
  }

  private bottomRightIndex(pts: Phaser.Math.Vector2[]) {
    let cx = 0;
    let cy = 0;
    for (const p of pts) {
      cx += p.x;
      cy += p.y;
    }
    cx /= pts.length;
    cy /= pts.length;

    let best = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < pts.length; i++) {
      const dx = pts[i].x - cx;
      const dy = pts[i].y - cy;

      const score = dx * 2.2 + dy * 1.0;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }

    return best;
  }

  private fusedRegularPentagon(
    hexCx: number,
    hexCy: number,
    vTop: Phaser.Math.Vector2,
    vBot: Phaser.Math.Vector2
  ): Phaser.Math.Vector2[] {
    const s = Phaser.Math.Distance.Between(vTop.x, vTop.y, vBot.x, vBot.y);

    const step = (Math.PI * 2) / 5;
    const R = s / (2 * Math.sin(Math.PI / 5));
    const a = s / (2 * Math.tan(Math.PI / 5));

    const mx = (vTop.x + vBot.x) * 0.5;
    const my = (vTop.y + vBot.y) * 0.5;

    const ndx = mx - hexCx;
    const ndy = my - hexCy;
    const invN = 1 / Math.max(0.0001, Math.hypot(ndx, ndy));
    const nx = ndx * invN;
    const ny = ndy * invN;

    const pcx = mx + nx * a;
    const pcy = my + ny * a;

    const ang0 = Math.atan2(vTop.y - pcy, vTop.x - pcx);

    const v1p = new Phaser.Math.Vector2(pcx + Math.cos(ang0 + step) * R, pcy + Math.sin(ang0 + step) * R);
    const v1m = new Phaser.Math.Vector2(pcx + Math.cos(ang0 - step) * R, pcy + Math.sin(ang0 - step) * R);

    const dp = Phaser.Math.Distance.Between(v1p.x, v1p.y, vBot.x, vBot.y);
    const dm = Phaser.Math.Distance.Between(v1m.x, v1m.y, vBot.x, vBot.y);

    const dir = dp <= dm ? 1 : -1;

    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 5; i++) {
      const a0 = ang0 + dir * step * i;
      pts.push(new Phaser.Math.Vector2(pcx + Math.cos(a0) * R, pcy + Math.sin(a0) * R));
    }

    return pts;
  }

  private ribbonStrokePoly(g: Phaser.GameObjects.Graphics, pts: Phaser.Math.Vector2[], blackW: number, whiteW: number) {
    g.lineStyle(blackW, 0x000000, 1);
    this.strokePoly(g, pts);

    g.lineStyle(whiteW, 0xffffff, 0.5);
    this.strokePoly(g, pts);
  }

  private stubBW(g: Phaser.GameObjects.Graphics, pts: Phaser.Math.Vector2[], idx: number, len: number) {
    const p = pts[idx];
    const prev = pts[(idx - 1 + pts.length) % pts.length];
    const next = pts[(idx + 1) % pts.length];

    const mx = (prev.x + next.x) * 0.5;
    const my = (prev.y + next.y) * 0.5;

    const dx = p.x - mx;
    const dy = p.y - my;
    const inv = 1 / Math.max(0.0001, Math.hypot(dx, dy));

    const ox = dx * inv;
    const oy = dy * inv;

    const x2 = p.x + ox * len;
    const y2 = p.y + oy * len;

    g.lineStyle(10, 0x000000, 0.35);
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(x2, y2);
    g.strokePath();

    g.lineStyle(4, 0xffffff, 0.22);
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(x2, y2);
    g.strokePath();
  }

  private regPoly(cx: number, cy: number, r: number, sides: number, rot: number): Phaser.Math.Vector2[] {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < sides; i++) {
      const ang = rot + (i * Math.PI * 2) / sides;
      pts.push(new Phaser.Math.Vector2(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r));
    }
    return pts;
  }

  private fillPoly(g: Phaser.GameObjects.Graphics, pts: Phaser.Math.Vector2[]) {
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.closePath();
    g.fillPath();
  }

  private strokePoly(g: Phaser.GameObjects.Graphics, pts: Phaser.Math.Vector2[]) {
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.closePath();
    g.strokePath();
  }
}
