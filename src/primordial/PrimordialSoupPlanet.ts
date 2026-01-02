import Phaser from "phaser";
import PlanetBase, { PlanetBaseConfig } from "../prefabs/PlanetBase";
import { pickCellByNearestProjectedCenter } from "../planet/PlanetMath";
import CellLayerField from "./CellLayerField";
import SoupSpawner from "./SoupSpawner";
import { PaletteColourSource, RandomHSVColourSource } from "./ColourSource";
import { stepBloom5x5 } from "./BloomPattern";

export default class PrimordialSoupPlanet extends PlanetBase {
  private spawnEvent?: Phaser.Time.TimerEvent;

  private field: CellLayerField;
  private spawner: SoupSpawner;

  private colours = new PaletteColourSource(["#1080F0", "#80F0FF", "#F0FF10", "#FF1080"]);
  private useRandom = false;

  constructor(scene: Phaser.Scene, x = 960, y = 540, cfg: PlanetBaseConfig = {}) {
    super(scene, x, y, cfg);

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
  }

  public startSoup() {
    this.spawnEvent?.remove(false);

    this.spawnEvent = this.scene.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => this.spawnOne()
    });
  }

  private spawnOne() {
    const pos = this.spawner.trySpawn((r, c) => this.field.hasCell(r, c));
    if (!pos) return;

    const now = this.scene.time.now;

    const source = this.useRandom ? new RandomHSVColourSource() : this.colours;
    const rgb = source.next();

    this.field.addSeed(pos.row, pos.col, rgb, now, 5000, true);

    this.field.applyBloomFromSeed(pos.row, pos.col, now, stepBloom5x5, true);

    this.gridData.setCell(pos.row, pos.col, { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 });
    this.redrawTiles();
  }

  private onPlanetDown = (pointer: Phaser.Input.Pointer) => {
    const dx = pointer.worldX - this.x;
    const dy = pointer.worldY - this.y;

    const picked = pickCellByNearestProjectedCenter(dx, dy, this.r, this.divisions, this.rotate);
    if (!picked) return;

    const now = this.scene.time.now;
    if (!this.field.isClickableAt(picked.row, picked.col, now)) return;

    this.field.applyBloomFromSeed(picked.row, picked.col, now, stepBloom5x5, true);
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
    if (this.field.isClickableAt(picked.row, picked.col, now)) {
      this.scene.input.setDefaultCursor("pointer");
    } else {
      this.scene.input.setDefaultCursor("default");
    }
  };

  private onSoupUpdate(_time: number, _delta: number) {
    const now = this.scene.time.now;

    const changed = this.field.tick(now, (row, col, rgba) => {
      this.gridData.setCell(row, col, { r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a });
    });

    if (changed) {
      this.redrawTiles();
    }
  }
}
