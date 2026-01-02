import Phaser from "phaser";
import PlanetBase, { PlanetBaseConfig } from "./PlanetBase";
import { projectLatLon, latForIndex, lonForIndex, pickCellByNearestProjectedCenter } from "../planet/PlanetMath";

type ActiveCell = {
  row: number;
  col: number;
  startAt: number;
  lifeMs: number;
  r: number;
  g: number;
  b: number;
  baseA: number;
};

export default class PrimordialSoupPlanet extends PlanetBase {
  private spawnEvent?: Phaser.Time.TimerEvent;

  private activeCells = new Map<string, ActiveCell>();

  private coloursHex = ["#ff00ff", "#00ffff", "#00ff00", "#ffff00"];

  constructor(scene: Phaser.Scene, x = 960, y = 540, cfg: PlanetBaseConfig = {}) {
    super(scene, x, y, cfg);

    this.onPlanetPointerDown(this.onPlanetDown);

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.onSoupUpdate, this);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onSoupUpdate, this);
      this.spawnEvent?.remove(false);
      this.spawnEvent = undefined;
      this.activeCells.clear();
    });
  }

  public startSoup() {
    this.spawnEvent?.remove(false);

    this.spawnEvent = this.scene.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.spawnOne()
    });
  }

  private spawnOne() {
    for (let tries = 0; tries < 200; tries++) {
      const row = Phaser.Math.Between(0, this.divisions - 1);
      const col = Phaser.Math.Between(0, this.divisions - 1);

      const key = `${row},${col}`;
      if (this.activeCells.has(key)) continue;

      const lat0 = latForIndex(row, this.divisions);
      const lat1 = latForIndex(row + 1, this.divisions);
      const lon0 = lonForIndex(col, this.divisions);
      const lon1 = lonForIndex(col + 1, this.divisions);

      const latMid = (lat0 + lat1) / 2;
      const lonMid = (lon0 + lon1) / 2;

      const p = projectLatLon(this.r, latMid, lonMid, this.rotate);
      if (p.z < 0) continue;

      const hex = Phaser.Utils.Array.GetRandom(this.coloursHex);
      const c = Phaser.Display.Color.HexStringToColor(hex);

      const now = this.scene.time.now;

      this.activeCells.set(key, {
        row,
        col,
        startAt: now,
        lifeMs: 5000,
        r: c.red,
        g: c.green,
        b: c.blue,
        baseA: 1
      });

      this.gridData.setCell(row, col, { r: c.red, g: c.green, b: c.blue, a: 1 });
      this.redrawTiles();
      return;
    }
  }

  private onPlanetDown = (pointer: Phaser.Input.Pointer) => {
    const dx = pointer.worldX - this.x;
    const dy = pointer.worldY - this.y;

    const picked = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);
    if (!picked) return;

    const key = `${picked.row},${picked.col}`;
    const seed = this.activeCells.get(key);
    if (!seed) return;

    this.triggerStepBloom(seed);
  };

  private triggerStepBloom(seed: ActiveCell) {
    const now = this.scene.time.now;

    const seedEndAt = seed.startAt + seed.lifeMs;

    const baseAAt = (timeMs: number) => {
      const t = (timeMs - seed.startAt) / seed.lifeMs;
      return Phaser.Math.Clamp(1 - Phaser.Math.Clamp(t, 0, 1), 0, 1);
    };

    const ensureBloomCell = (row: number, col: number, startAt: number) => {
      const lifeMs = seedEndAt - startAt;
      if (lifeMs <= 0) return;

      const baseA = baseAAt(startAt);
      if (baseA <= 0) return;

      const key = `${row},${col}`;
      if (this.activeCells.has(key)) return;

      this.activeCells.set(key, {
        row,
        col,
        startAt,
        lifeMs,
        r: seed.r,
        g: seed.g,
        b: seed.b,
        baseA
      });
    };

    const addAt = (delayMs: number, offsets: Array<[number, number]>) => {
      const startAt = now + delayMs;

      for (const [dr, dc] of offsets) {
        const row = Phaser.Math.Wrap(seed.row + dr, 0, this.divisions);
        const col = Phaser.Math.Wrap(seed.col + dc, 0, this.divisions);
        ensureBloomCell(row, col, startAt);
      }
    };

    const cross1: Array<[number, number]> = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1]
    ];

    const square3: Array<[number, number]> = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    const cross2: Array<[number, number]> = [
      [-2, 0],
      [0, 2],
      [2, 0],
      [0, -2]
    ];

    const cross3: Array<[number, number]> = [
      [-2, -1], [-2, 1],
      [-1, -2], [-1, 2],
      [1, -2],  [1, 2],
      [2, -1],  [2, 1]
    ];

    addAt(0, cross1);
    addAt(1000, square3);
    addAt(2000, cross2);
    addAt(3000, cross3);
  }

  private onSoupUpdate(_time: number, _delta: number) {
    if (this.activeCells.size === 0) return;

    const now = this.scene.time.now;

    let changed = false;

    for (const [key, cell] of this.activeCells) {
      const dt = now - cell.startAt;

      if (dt < 0) continue;

      const t = dt / cell.lifeMs;

      if (t >= 1) {
        this.gridData.setCell(cell.row, cell.col, { r: cell.r, g: cell.g, b: cell.b, a: 0 });
        this.activeCells.delete(key);
        changed = true;
        continue;
      }

      const a = Phaser.Math.Clamp(cell.baseA * (1 - Phaser.Math.Clamp(t, 0, 1)), 0, 1);
      this.gridData.setCell(cell.row, cell.col, { r: cell.r, g: cell.g, b: cell.b, a });
      changed = true;
    }

    if (changed) {
      this.redrawTiles();
    }
  }
}
