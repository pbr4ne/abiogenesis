import Phaser from "phaser";
import type { ActiveCell, BloomStep, CellLayer, RGBA01, RGB } from "./PrimordialSoupTypes";

export default class CellLayerField {
  private divisions: number;
  private active = new Map<string, ActiveCell>();

  constructor(divisions: number) {
    this.divisions = divisions;
  }

  public hasCell(row: number, col: number) {
    return this.active.has(this.keyOf(row, col));
  }

  public getCell(row: number, col: number) {
    return this.active.get(this.keyOf(row, col));
  }

  public addSeed(row: number, col: number, rgb: RGB, startAt: number, lifeMs: number, clickable: boolean) {
    const key = this.keyOf(row, col);

    const layer: CellLayer = {
      startAt,
      lifeMs,
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      baseA: 1,
      clickable
    };

    const existing = this.active.get(key);
    if (existing) {
      existing.layers.push(layer);
      return;
    }

    this.active.set(key, { row, col, layers: [layer] });
  }

  public isClickableAt(row: number, col: number, now: number) {
    const cell = this.active.get(this.keyOf(row, col));
    if (!cell) return false;

    for (const layer of cell.layers) {
      if (!layer.clickable) continue;
      const dt = now - layer.startAt;
      if (dt < 0) continue;
      if (dt >= layer.lifeMs) continue;
      return true;
    }

    return false;
  }

  public lockClickableAt(row: number, col: number) {
    const cell = this.active.get(this.keyOf(row, col));
    if (!cell) return;

    for (const layer of cell.layers) {
      layer.clickable = false;
    }
  }

  public applyBloomFromSeed(row: number, col: number, now: number, steps: BloomStep[], lockSeed: boolean) {
    const seedCell = this.active.get(this.keyOf(row, col));
    if (!seedCell) return;

    const seedLayer = this.pickSeedLayer(seedCell, now);
    if (!seedLayer) return;

    if (lockSeed) {
      for (const layer of seedCell.layers) {
        layer.clickable = false;
      }
    }

    const touched = new Set<string>();
    const offKey = (dr: number, dc: number) => `${dr},${dc}`;

    const seedEndAt = seedLayer.startAt + seedLayer.lifeMs;

    const alpha01At = (timeMs: number) => {
      const t = (timeMs - seedLayer.startAt) / seedLayer.lifeMs;
      return Phaser.Math.Clamp(1 - Phaser.Math.Clamp(t, 0, 1), 0, 1);
    };

    const addLayerAt = (absRow: number, absCol: number, startAt: number) => {
      const lifeMs = seedEndAt - startAt;
      if (lifeMs <= 0) return;

      const baseA = Phaser.Math.Clamp(seedLayer.baseA * alpha01At(startAt), 0, 1);
      if (baseA <= 0) return;

      const key = this.keyOf(absRow, absCol);

      const newLayer: CellLayer = {
        startAt,
        lifeMs,
        r: seedLayer.r,
        g: seedLayer.g,
        b: seedLayer.b,
        baseA,
        clickable: false
      };

      const existing = this.active.get(key);
      if (existing) {
        existing.layers.push(newLayer);
        return;
      }

      this.active.set(key, { row: absRow, col: absCol, layers: [newLayer] });
    };

    for (const step of steps) {
      const startAt = now + step.delayMs;

      for (const [dr, dc] of step.offsets) {
        const k = offKey(dr, dc);
        if (touched.has(k)) continue;
        touched.add(k);

        const rr = Phaser.Math.Wrap(row + dr, 0, this.divisions);
        const cc = Phaser.Math.Wrap(col + dc, 0, this.divisions);

        addLayerAt(rr, cc, startAt);
      }
    }
  }

  public tick(now: number, writeCell: (row: number, col: number, rgba: RGBA01) => void) {
    if (this.active.size === 0) return false;

    let changed = false;

    for (const [key, cell] of this.active) {
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
          changed = true;
          continue;
        }

        const a = Phaser.Math.Clamp(layer.baseA * (1 - Phaser.Math.Clamp(t, 0, 1)), 0, 1);
        if (a <= 0) {
          changed = true;
          continue;
        }

        aSum += a;
        rSum += layer.r * a;
        gSum += layer.g * a;
        bSum += layer.b * a;

        nextLayers.push(layer);
      }

      cell.layers = nextLayers;

      if (cell.layers.length === 0) {
        writeCell(cell.row, cell.col, { r: 0, g: 0, b: 0, a: 0 });
        this.active.delete(key);
        changed = true;
        continue;
      }

      const aOut = Phaser.Math.Clamp(aSum, 0, 1);
      if (aOut <= 0) {
        writeCell(cell.row, cell.col, { r: 0, g: 0, b: 0, a: 0 });
        changed = true;
        continue;
      }

      const r = Math.round(rSum / aSum);
      const g = Math.round(gSum / aSum);
      const b = Math.round(bSum / aSum);

      writeCell(cell.row, cell.col, { r, g, b, a: aOut });
      changed = true;
    }

    return changed;
  }

  private keyOf(row: number, col: number) {
    return `${row},${col}`;
  }

  private pickSeedLayer(cell: ActiveCell, now: number) {
    for (const layer of cell.layers) {
      const dt = now - layer.startAt;
      if (dt < 0) continue;
      if (dt >= layer.lifeMs) continue;
      return layer;
    }
    return null;
  }
}
