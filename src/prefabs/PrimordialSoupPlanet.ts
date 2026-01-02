import Phaser from "phaser";
import PlanetBase, { PlanetBaseConfig } from "./PlanetBase";
import { log } from "../utilities/GameUtils";
import { projectLatLon, latForIndex, lonForIndex } from "../planet/PlanetMath";

type ActiveCell = {
  row: number;
  col: number;
  startAt: number;
  lifeMs: number;
  r: number;
  g: number;
  b: number;
};

export default class PrimordialSoupPlanet extends PlanetBase {
  private spawnEvent?: Phaser.Time.TimerEvent;

  private activeCells = new Map<string, ActiveCell>();

  private coloursHex = ["#ff00ff", "#00ffff", "#00ffff", "#ffff00"];

  constructor(scene: Phaser.Scene, x = 960, y = 540, cfg: PlanetBaseConfig = {}) {
    super(scene, x, y, cfg);

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
        lifeMs: 10000,
        r: c.red,
        g: c.green,
        b: c.blue
      });

      this.gridData.setCell(row, col, { r: c.red, g: c.green, b: c.blue, a: 1 });
      this.redrawTiles();
      return;
    }
  }

  private onSoupUpdate(_time: number, _delta: number) {
    if (this.activeCells.size === 0) return;

    const now = this.scene.time.now;

    let changed = false;

    for (const [key, cell] of this.activeCells) {
      const t = (now - cell.startAt) / cell.lifeMs;

      if (t >= 1) {
        this.gridData.setCell(cell.row, cell.col, { r: cell.r, g: cell.g, b: cell.b, a: 0 });
        this.activeCells.delete(key);
        changed = true;
        continue;
      }

      const a = 1 - Phaser.Math.Clamp(t, 0, 1);

      this.gridData.setCell(cell.row, cell.col, { r: cell.r, g: cell.g, b: cell.b, a });
      changed = true;
    }

    if (changed) {
      this.redrawTiles();
    }
  }
}
