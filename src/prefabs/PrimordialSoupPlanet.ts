import Phaser from "phaser";
import PlanetBase, { PlanetBaseConfig } from "./PlanetBase";
import { projectLatLon, latForIndex, lonForIndex, pickCellByNearestProjectedCenter } from "../planet/PlanetMath";

type CellLayer = {
  startAt: number;
  lifeMs: number;
  r: number;
  g: number;
  b: number;
  baseA: number;
  clickable: boolean;
};

type ActiveCell = {
  row: number;
  col: number;
  layers: CellLayer[];
};

export default class PrimordialSoupPlanet extends PlanetBase {
  private spawnEvent?: Phaser.Time.TimerEvent;

  private activeCells = new Map<string, ActiveCell>();

  private coloursHex = ["#ff00ff", "#00ffff", "#00ff00", "#ffff00"];

  constructor(scene: Phaser.Scene, x = 960, y = 540, cfg: PlanetBaseConfig = {}) {
    super(scene, x, y, cfg);

    this.onPlanetPointerDown(this.onPlanetDown);
    this.onPlanetPointerMove(this.onPlanetMove);

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.onSoupUpdate, this);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onSoupUpdate, this);
      this.scene.input.setDefaultCursor("default");

      this.spawnEvent?.remove(false);
      this.spawnEvent = undefined;
      this.activeCells.clear();
    });
  }

  public startSoup() {
    this.spawnEvent?.remove(false);

    this.spawnEvent = this.scene.time.addEvent({
      delay: 100,
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
        layers: [{
          startAt: now,
          lifeMs: 5000,
          r: c.red,
          g: c.green,
          b: c.blue,
          baseA: 1,
          clickable: true
        }]
      });


      this.gridData.setCell(row, col, { r: c.red, g: c.green, b: c.blue, a: 1 });
      this.redrawTiles();
      return;
    }
  }

  private isClickableNow(cell: ActiveCell, now: number) {
    for (const layer of cell.layers) {
      if (!layer.clickable) continue;

      const dt = now - layer.startAt;
      if (dt < 0) continue;
      if (dt >= layer.lifeMs) continue;

      return true;
    }
    return false;
  }

  private onPlanetDown = (pointer: Phaser.Input.Pointer) => {
    const dx = pointer.worldX - this.x;
    const dy = pointer.worldY - this.y;

    const picked = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);
    if (!picked) return;

    const key = `${picked.row},${picked.col}`;
    const cell = this.activeCells.get(key);
    if (!cell) return;

    const now = this.scene.time.now;
    if (!this.isClickableNow(cell, now)) return;

    this.triggerStepBloom(cell);
  };

  private onPlanetMove = (pointer: Phaser.Input.Pointer) => {
    const dx = pointer.worldX - this.x;
    const dy = pointer.worldY - this.y;

    const picked = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);

    if (!picked) {
      this.scene.input.setDefaultCursor("default");
      return;
    }

    const key = `${picked.row},${picked.col}`;
    const cell = this.activeCells.get(key);

    const now = this.scene.time.now;
    if (cell && this.isClickableNow(cell, now)) {
      this.scene.input.setDefaultCursor("pointer");
    } else {
      this.scene.input.setDefaultCursor("default");
    }
  };

  private triggerStepBloom(seedCell: ActiveCell) {
    const now = this.scene.time.now;

    const touched = new Set<string>();
    const offKey = (dr: number, dc: number) => `${dr},${dc}`;

    for (const layer of seedCell.layers) {
      layer.clickable = false;
    }

    const seedLayer = seedCell.layers[0];
    const seedEndAt = seedLayer.startAt + seedLayer.lifeMs;

    const baseAAt = (timeMs: number) => {
      const t = (timeMs - seedLayer.startAt) / seedLayer.lifeMs;
      return Phaser.Math.Clamp(1 - Phaser.Math.Clamp(t, 0, 1), 0, 1);
    };

    const addLayerAt = (row: number, col: number, startAt: number) => {
      const lifeMs = seedEndAt - startAt;
      if (lifeMs <= 0) return;

      const baseA = baseAAt(startAt);
      if (baseA <= 0) return;

      const key = `${row},${col}`;
      const existing = this.activeCells.get(key);

      const newLayer: CellLayer = {
        startAt,
        lifeMs,
        r: seedLayer.r,
        g: seedLayer.g,
        b: seedLayer.b,
        baseA,
        clickable: false
      };

      if (existing) {
        existing.layers.push(newLayer);
        return;
      }

      this.activeCells.set(key, {
        row,
        col,
        layers: [newLayer]
      });
    };

    const addAt = (delayMs: number, offsets: Array<[number, number]>) => {
      const startAt = now + delayMs;

      for (const [dr, dc] of offsets) {
        const k = offKey(dr, dc);
        if (touched.has(k)) continue;
        touched.add(k);

        const row = Phaser.Math.Wrap(seedCell.row + dr, 0, this.divisions);
        const col = Phaser.Math.Wrap(seedCell.col + dc, 0, this.divisions);

        addLayerAt(row, col, startAt);
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
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;

      const nextLayers: CellLayer[] = [];

      for (const layer of cell.layers) {
        const dt = now - layer.startAt;

        if (dt < 0) {
          nextLayers.push(layer);
          continue;
        }

        const t = dt / layer.lifeMs;
        if (t >= 1) {
          continue;
        }

        const a = layer.baseA * (1 - Phaser.Math.Clamp(t, 0, 1));
        if (a <= 0) continue;

        aSum += a;
        rSum += layer.r * a;
        gSum += layer.g * a;
        bSum += layer.b * a;

        nextLayers.push(layer);
      }

      cell.layers = nextLayers;

      if (cell.layers.length === 0) {
        this.gridData.setCell(cell.row, cell.col, { r: 0, g: 0, b: 0, a: 0 });
        this.activeCells.delete(key);
        changed = true;
        continue;
      }

      const aOut = Phaser.Math.Clamp(aSum, 0, 1);

      if (aOut <= 0) {
        this.gridData.setCell(cell.row, cell.col, { r: 0, g: 0, b: 0, a: 0 });
        changed = true;
        continue;
      }

      const r = Math.round(rSum / aSum);
      const g = Math.round(gSum / aSum);
      const b = Math.round(bSum / aSum);

      this.gridData.setCell(cell.row, cell.col, { r, g, b, a: aOut });
      changed = true;
    }

    if (changed) {
      this.redrawTiles();
    }
  }
}
