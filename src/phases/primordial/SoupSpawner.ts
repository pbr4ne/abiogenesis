import Phaser from "phaser";
import { projectLatLon, latForIndex, lonForIndex } from "../../planet/PlanetMath";

export default class SoupSpawner {
  private divisions: number;
  private r: number;
  private rotate: any;

  constructor(divisions: number, r: number, rotate: any) {
    this.divisions = divisions;
    this.r = r;
    this.rotate = rotate;
  }

  public trySpawn(isTaken: (row: number, col: number) => boolean) {
    for (let tries = 0; tries < 200; tries++) {
      const row = Phaser.Math.Between(0, this.divisions - 1);
      const col = Phaser.Math.Between(0, this.divisions - 1);

      if (isTaken(row, col)) continue;

      const lat0 = latForIndex(row, this.divisions);
      const lat1 = latForIndex(row + 1, this.divisions);
      const lon0 = lonForIndex(col, this.divisions);
      const lon1 = lonForIndex(col + 1, this.divisions);

      const latMid = (lat0 + lat1) / 2;
      const lonMid = (lon0 + lon1) / 2;

      const p = projectLatLon(this.r, latMid, lonMid, this.rotate);
      if (p.z < 0) continue;

      return { row, col };
    }

    return null;
  }
}
