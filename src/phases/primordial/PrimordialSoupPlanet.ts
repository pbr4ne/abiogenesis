import Phaser from "phaser";
import PlanetBase from "../../planet/PlanetBase";
import { pickCellByNearestProjectedCenter } from "../../planet/PlanetMath";
import CellLayerField from "./CellLayerField";
import SoupSpawner from "./SoupSpawner";
import { stepBloom5x5 } from "./BloomPattern";
import SoupProgress from "./SoupProgress";
import { paintHydrosphere } from "../terraform/HydrosphereMap";
import PlanetRunState from "../../planet/PlanetRunState";

import PlanetGrid from "../../planet/PlanetGrid";

export default class PrimordialSoupPlanet extends PlanetBase {
  private spawnEvent?: Phaser.Time.TimerEvent;
  private field: CellLayerField;
  private spawner: SoupSpawner;
  private progress = new SoupProgress();
  private run: PlanetRunState;
  private soupData: PlanetGrid;
  private terrainCells: ReturnType<PlanetGrid["getCellsRef"]>;

  constructor(scene: Phaser.Scene, x = 960, y = 540) {
    super(scene, x, y);

    this.run = scene.registry.get("run") as PlanetRunState;
    this.field = new CellLayerField(this.divisions);
    this.spawner = new SoupSpawner(this.divisions, this.r);

    this.soupData = new PlanetGrid(this.divisions);

    this.onPlanetPointerDown(this.onPlanetDown);
    this.onPlanetPointerMove(this.onPlanetMove);

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.onSoupUpdate, this);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onSoupUpdate, this);
      this.scene.input.setDefaultCursor("default");
      this.spawnEvent?.remove(false);
      this.spawnEvent = undefined;
    });

    paintHydrosphere(this.gridData, this.run.hydroAlt, this.run.waterLevel);

    this.terrainCells = this.cloneCells(this.gridData.getCellsRef());

    this.redrawCompositeTiles();
  }

  public startSoup() {
    this.progress.setAllFill01(0);
    this.rescheduleSpawner();
  }

  private rescheduleSpawner() {
    this.spawnEvent?.remove(false);

    this.spawnEvent = this.scene.time.addEvent({
      delay: this.progress.spawnDelayMs(),
      loop: true,
      callback: () => {
        const n = this.spawnsPerTick();

        for (let i = 0; i < n; i++) {
          const didSpawn = this.spawnOne();
          if (!didSpawn) break;
        }
      }
    });
  }

  private spawnsPerTick() {
    const t = Phaser.Math.Clamp(this.progress.getTotal01(), 0, 1);

    const n = Phaser.Math.Linear(1, 6, t);

    return Math.max(1, Math.round(n));
  }

  private spawnOne(): boolean {
    const pos = this.spawner.trySpawn(this.rotate, (r, c) => this.field.hasCell(r, c) && this.isWaterCell(r, c));
    if (!pos) return false;

    const now = this.scene.time.now;
    const rgb = this.progress.pickSpawnRGB();

    this.field.addSeed(pos.row, pos.col, rgb, now, 5000, true);

    const delay = this.progress.spawnDelayMs();
    const bloomP = (delay <= 60) ? 1 : this.progress.spawnBloomChance01();

    if (Math.random() < bloomP) {
      this.field.applyBloomFromSeed(pos.row, pos.col, now, stepBloom5x5, true);
    }

    this.soupData.setCell(pos.row, pos.col, { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 });
    this.redrawCompositeTiles();

    const targetDelay = this.progress.spawnDelayMs();
    if (this.spawnEvent && this.spawnEvent.delay !== targetDelay) {
      this.rescheduleSpawner();
    }

    return true;
  }

  private isAllowedSoupRow(row: number): boolean {
    return row >= 4;
  }

  private isWaterCell(row: number, col: number): boolean {
    const altAny: any = (this.run as any)?.hydroAlt;
    const wl = (this.run as any).waterLevel ?? 0;

    if (!this.isAllowedSoupRow(row)) return false;

    let alt: number | null = null;

    if (Array.isArray(altAny)) {
      const v = altAny[row]?.[col];
      if (typeof v === "number") alt = v;
    } else if (altAny && typeof altAny.getAltitude === "function") {
      const v = altAny.getAltitude(row, col);
      if (typeof v === "number") alt = v;
    } else if (altAny && typeof altAny.getCell === "function") {
      const v = altAny.getCell(row, col);
      if (typeof v === "number") alt = v;
    }

    if (alt === null) return true;

    const eps = 1e-6;
    return wl > 0 && alt < (wl - eps);
  }

  private onPlanetDown = (pointer: Phaser.Input.Pointer) => {
    const dx = pointer.worldX - this.x;
    const dy = pointer.worldY - this.y;

    const picked = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);
    if (!picked) return;

    if (!this.isWaterCell(picked.row, picked.col)) return;

    const now = this.scene.time.now;

    const cell = this.soupData.getCell(picked.row, picked.col);

    if (cell && cell.a > 0) {
      const token = this.field.getCellClickToken(picked.row, picked.col);

      if (token !== null && this.progress.tryConsumeCellClick(picked.row, picked.col, token)) {
        this.progress.onClickColour({ r: cell.r, g: cell.g, b: cell.b });
        this.rescheduleSpawner();
      }
    }

    if (!this.field.isClickableAt(picked.row, picked.col, now)) return;

    this.field.applyBloomFromSeed(picked.row, picked.col, now, stepBloom5x5, true, true);

    const changed = this.field.tick(now, (row, col, rgba) => {
      if (!this.isWaterCell(row, col)) {
        this.soupData.setCell(row, col, { r: 0, g: 0, b: 0, a: 0 });
        return;
      }

      this.soupData.setCell(row, col, { r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a });
    });

    if (changed) this.redrawCompositeTiles();
  };

  private onPlanetMove = (pointer: Phaser.Input.Pointer) => {
    const dx = pointer.worldX - this.x;
    const dy = pointer.worldY - this.y;

    const picked = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);
    if (!picked) {
      this.scene.input.setDefaultCursor("default");
      return;
    }

    if (!this.isWaterCell(picked.row, picked.col)) {
      this.scene.input.setDefaultCursor("default");
      return;
    }

    const now = this.scene.time.now;
    const cell = this.soupData.getCell(picked.row, picked.col);

    if ((cell && cell.a > 0) || this.field.isClickableAt(picked.row, picked.col, now)) {
      this.scene.input.setDefaultCursor("pointer");
    } else {
      this.scene.input.setDefaultCursor("default");
    }
  }

  private onSoupUpdate(_time: number, _delta: number) {
    const now = this.scene.time.now;

    const changed = this.field.tick(now, (row, col, rgba) => {
      if (!this.isWaterCell(row, col)) {
        this.soupData.setCell(row, col, { r: 0, g: 0, b: 0, a: 0 });
        return;
      }

      this.soupData.setCell(row, col, { r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a });
    });

    this.progress.computeHelixBinsFromGrid(() => this.iterVisibleGridColours());

    if (changed) this.redrawCompositeTiles();
  }

  private * iterVisibleGridColours() {
    for (let r = 0; r < this.divisions; r++) {
      if (!this.isAllowedSoupRow(r)) continue;

      for (let c = 0; c < this.divisions; c++) {
        if (!this.isWaterCell(r, c)) continue;

        const cell = this.soupData.getCell(r, c);
        if (!cell || cell.a <= 0) continue;
        yield { r: cell.r, g: cell.g, b: cell.b };
      }
    }
  }

  public getProgress() {
    return this.progress;
  }

  private cloneCells(cells: ReturnType<PlanetGrid["getCellsRef"]>) {
    return cells.map(row => row.map(c => ({ r: c.r, g: c.g, b: c.b, a: c.a })));
  }

  private redrawCompositeTiles() {
    const base = this.terrainCells;
    const soup = this.soupData.getCellsRef();

    for (let r = 0; r < this.divisions; r++) {
      for (let c = 0; c < this.divisions; c++) {
        const t = base[r][c];
        const s = soup[r][c];

        const a = Phaser.Math.Clamp(s.a ?? 0, 0, 1);

        if (a <= 0) {
          this.gridData.setCell(r, c, { r: t.r, g: t.g, b: t.b, a: t.a });
          continue;
        }

        const rr = Math.round(t.r * (1 - a) + s.r * a);
        const gg = Math.round(t.g * (1 - a) + s.g * a);
        const bb = Math.round(t.b * (1 - a) + s.b * a);

        this.gridData.setCell(r, c, { r: rr, g: gg, b: bb, a: 1 });
      }
    }

    this.redrawTiles();
  }
}
