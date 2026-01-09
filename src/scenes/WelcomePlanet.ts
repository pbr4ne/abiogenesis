import Phaser from "phaser";
import PlanetBase from "../planet/PlanetBase";
import { pickCellByNearestProjectedCenter } from "../planet/PlanetMath";

const hsvToRgb = (h: number, s: number, v: number) => {
  const c = v * s;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0, g = 0, b = 0;

  if (hh < 1) {
    r = c; g = x;
  } else if (hh < 2) {
    r = x; g = c;
  } else if (hh < 3) {
    g = c; b = x;
  } else if (hh < 4) {
    g = x; b = c;
  } else if (hh < 5) {
    r = x; b = c;
  } else {
    r = c; b = x;
  }

  const m = v - c;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
};

const rgbToHexStr = (r: number, g: number, b: number) =>
  "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

type CellState = {
  h: number;
  s: number;
  v: number;
  a: number;
  targetA: number;
};

export default class WelcomePlanet extends PlanetBase {
  private tickEv?: Phaser.Time.TimerEvent;
  private cells: CellState[] = [];

  private hoverMul = 1;
  private hoverTween?: Phaser.Tweens.Tween;
  private destroyed = false;

  private painting = false;
  private lastPaintRow = -999;
  private lastPaintCol = -999;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      diameter: 360,
      divisions: 40,
      tiltDeg: -28,
      yawDeg: 20,
      wireAlpha: 0.28
    });

    this.hitZone.on("pointerover", this.onOver);
    this.hitZone.on("pointerout", this.onOut);
    this.hitZone.on("pointermove", this.onMove);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.destroyed = true;
      this.hitZone.off("pointerover", this.onOver);
      this.hitZone.off("pointerout", this.onOut);
      this.hitZone.off("pointermove", this.onMove);
    });
  }

  private clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
  }

  private idx(row: number, col: number) {
    return row * this.divisions + col;
  }

  private apply(row: number, col: number, c: CellState) {
    const a = this.clamp01(c.a);
    if (a <= 0.001) {
      this.gridData.setHex(row, col, "#000000", 0);
      return;
    }

    const v = this.clamp01(c.v * this.hoverMul);
    const { r, g, b } = hsvToRgb(c.h, c.s, v);
    this.gridData.setHex(row, col, rgbToHexStr(r, g, b), a);
  }

  private setHoverMul(to: number) {
    if (this.destroyed) return;

    this.hoverTween?.stop();
    this.hoverTween = this.scene?.tweens?.add({
      targets: this,
      hoverMul: to,
      duration: to > this.hoverMul ? 120 : 180,
      ease: "Sine.easeOut"
    });
  }

  private onOver = () => {
    if (this.destroyed) return;
    this.painting = true;
    this.scene?.input?.setDefaultCursor("pointer");
    this.setHoverMul(1.15);
  };

  private onOut = () => {
    if (this.destroyed) return;
    this.painting = false;
    this.lastPaintRow = -999;
    this.lastPaintCol = -999;
    this.scene?.input?.setDefaultCursor("default");
    this.setHoverMul(1);
  };

  private worldToCell(pointer: Phaser.Input.Pointer) {
    const r = this.diameter * 0.5;

    const m = this.getWorldTransformMatrix();

    const inv = new Phaser.GameObjects.Components.TransformMatrix();
    inv.copyFrom(m);
    inv.invert();

    const p = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
    inv.transformPoint(p.x, p.y, p);

    const nx = p.x / r;
    const ny = p.y / r;

    if (nx * nx + ny * ny > 1) return null;

    const u = (nx + 1) * 0.5;
    const v = (ny + 1) * 0.5;

    const col = Phaser.Math.Clamp(
      Math.floor(u * this.divisions),
      0,
      this.divisions - 1
    );

    const row = Phaser.Math.Clamp(
      Math.floor(v * this.divisions),
      0,
      this.divisions - 1
    );

    return { row, col };
  }

  private paintAt(row: number, col: number) {
    const div = this.divisions;

    const paintOne = (rr: number, cc: number, a: number) => {
      if (rr < 0 || cc < 0 || rr >= div || cc >= div) return;
      const c = this.cells[this.idx(rr, cc)];
      c.h = Phaser.Math.Between(0, 359);
      c.s = Phaser.Math.FloatBetween(0.75, 1);
      c.v = Phaser.Math.FloatBetween(0.75, 1);
      c.a = Math.max(c.a, a);
      c.targetA = Math.max(c.targetA, a);
    };

    paintOne(row, col, 1);

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (Phaser.Math.FloatBetween(0, 1) < 0.65) paintOne(row + dr, col + dc, 0.75);
      }
    }

    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) continue;
        if (Math.abs(dr) + Math.abs(dc) > 3) continue;
        if (Phaser.Math.FloatBetween(0, 1) < 0.22) paintOne(row + dr, col + dc, 0.45);
      }
    }
  }

  private onMove = (pointer: Phaser.Input.Pointer, localX: number, localY: number) => {
    if (this.destroyed || !this.painting) return;

    const dx = localX - this.r;
    const dy = localY - this.r;

    const cell = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);
    if (!cell) return;

    if (cell.row === this.lastPaintRow && cell.col === this.lastPaintCol) return;
    this.lastPaintRow = cell.row;
    this.lastPaintCol = cell.col;

    this.paintAt(cell.row, cell.col);
  };

  private initCells() {
    const div = this.divisions;
    this.cells.length = div * div;

    for (let row = 0; row < div; row++) {
      for (let col = 0; col < div; col++) {
        const c: CellState = {
          h: 0,
          s: 0,
          v: 0,
          a: 0,
          targetA: 0
        };

        this.cells[this.idx(row, col)] = c;
        this.apply(row, col, c);
      }
    }
  }

  private decayCells() {
    const div = this.divisions;

    for (let row = 0; row < div; row++) {
      for (let col = 0; col < div; col++) {
        const c = this.cells[this.idx(row, col)];

        c.a += (c.targetA - c.a) * 0.35;
        c.targetA *= 0.78;

        if (c.a < 0.01 && c.targetA < 0.01) {
          c.a = 0;
          c.targetA = 0;
        }

        this.apply(row, col, c);
      }
    }
  }

  public startFlashing() {
    if (this.tickEv) return;

    this.initCells();
    this.redrawTiles();

    this.tickEv = this.scene?.time?.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (this.destroyed) return;
        this.decayCells();
        this.redrawTiles();
      }
    });
  }

  public stopFlashing() {
    this.tickEv?.remove(false);
    this.tickEv = undefined;

    this.hoverTween?.stop();
    this.hoverTween = undefined;

    this.hoverMul = 1;
    this.painting = false;
    this.lastPaintRow = -999;
    this.lastPaintCol = -999;
    this.scene?.input?.setDefaultCursor("default");
  }

  public destroy(fromScene?: boolean) {
    this.stopFlashing();
    super.destroy(fromScene);
  }
}
