import Phaser from "phaser";
import PlanetBase, { PlanetBaseConfig } from "../../planet/PlanetBase";
import { pickCellByNearestProjectedCenter } from "../../planet/PlanetMath";
import CellLayerField from "./CellLayerField";
import SoupSpawner from "./SoupSpawner";
import { stepBloom5x5 } from "./BloomPattern";
import SoupProgress from "./SoupProgress";
import { paintHydrosphere } from "../terraform/HydrosphereMap";
import PlanetRunState from "../../planet/PlanetRunState";

export default class PrimordialSoupPlanet extends PlanetBase {
  private spawnEvent?: Phaser.Time.TimerEvent;
  private field: CellLayerField;
  private spawner: SoupSpawner;
  private progress = new SoupProgress();
  private run: PlanetRunState;

  constructor(scene: Phaser.Scene, x = 960, y = 540) {
    super(scene, x, y);

    this.run = scene.registry.get("run") as PlanetRunState;
    this.field = new CellLayerField(this.divisions);
    this.spawner = new SoupSpawner(this.divisions, this.r, this.rotate);

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
    this.redrawTiles();
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
      callback: () => this.spawnOne()
    });
  }

  private spawnOne() {
    const pos = this.spawner.trySpawn((r, c) => this.field.hasCell(r, c));
    if (!pos) return;

    const now = this.scene.time.now;

    const rgb = this.progress.pickSpawnRGB();

    this.field.addSeed(pos.row, pos.col, rgb, now, 5000, true);

    const delay = this.progress.spawnDelayMs();
    const bloomP = (delay <= 60) ? 1 : this.progress.spawnBloomChance01();

    if (Math.random() < bloomP) {
      this.field.applyBloomFromSeed(pos.row, pos.col, now, stepBloom5x5, true);
    }

    this.gridData.setCell(pos.row, pos.col, { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 });
    this.redrawTiles();

    const targetDelay = this.progress.spawnDelayMs();
    if (this.spawnEvent && this.spawnEvent.delay !== targetDelay) {
      this.rescheduleSpawner();
    }
  }

  private onPlanetDown = (pointer: Phaser.Input.Pointer) => {
    const dx = pointer.worldX - this.x;
    const dy = pointer.worldY - this.y;

    const picked = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);
    if (!picked) return;

    const now = this.scene.time.now;

    const cell = this.gridData.getCell(picked.row, picked.col);

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
      this.gridData.setCell(row, col, { r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a });
    });

    if (changed) this.redrawTiles();
  };

  private onPlanetMove = (pointer: Phaser.Input.Pointer) => {
    const dx = pointer.worldX - this.x;
    const dy = pointer.worldY - this.y;

    const picked = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);
    if (!picked) {
      this.scene.input.setDefaultCursor("default");
      return;
    }

    const now = this.scene.time.now;
    const cell = this.gridData.getCell(picked.row, picked.col);
    if ((cell && cell.a > 0) || this.field.isClickableAt(picked.row, picked.col, now)) {
      this.scene.input.setDefaultCursor("pointer");
    } else {
      this.scene.input.setDefaultCursor("default");
    }
  }

  private onSoupUpdate(_time: number, _delta: number) {
    const now = this.scene.time.now;

    const changed = this.field.tick(now, (row, col, rgba) => {
      this.gridData.setCell(row, col, { r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a });
    });

    this.progress.computeHelixBinsFromGrid(() => this.iterVisibleGridColours());

    if (changed) this.redrawTiles();
  }

  private * iterVisibleGridColours() {
    for (let r = 0; r < this.divisions; r++) {
      for (let c = 0; c < this.divisions; c++) {
        const cell = this.gridData.getCell(r, c);
        if (!cell || cell.a <= 0) continue;
        yield { r: cell.r, g: cell.g, b: cell.b };
      }
    }
  }

  public getProgress() {
    return this.progress;
  }
}
