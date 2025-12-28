import Phaser from "phaser";

export default class Planet extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x = 960,
    y = 540,
    colours?: string[][]
  ) {
    super(scene, x, y);

    const divisions = 40;
    const diameter = 768;
    const r = diameter / 2;

    const tilt = Phaser.Math.DegToRad(-28);
    const yaw = Phaser.Math.DegToRad(20);

    const colourGrid = this.generateColours(colours, divisions);

    const planet = scene.add.ellipse(0, 0, diameter, diameter, 0xffffff, 1);
    this.add(planet);

    const tiles = scene.add.graphics();
    this.add(tiles);

    const rotate = (px: number, py: number, pz: number) => {
      const x1 = px * Math.cos(yaw) + pz * Math.sin(yaw);
      const z1 = -px * Math.sin(yaw) + pz * Math.cos(yaw);

      const y2 = py * Math.cos(tilt) - z1 * Math.sin(tilt);
      const z2 = py * Math.sin(tilt) + z1 * Math.cos(tilt);

      return { x: x1, y: y2, z: z2 }
    }

    const toColour = (hex: string) => Phaser.Display.Color.HexStringToColor(hex).color;

    const sub = 2;

    for (let latI = 0; latI < divisions; latI++) {
      const lat0 = Phaser.Math.Linear(-Math.PI / 2, Math.PI / 2, latI / divisions);
      const lat1 = Phaser.Math.Linear(-Math.PI / 2, Math.PI / 2, (latI + 1) / divisions);

      for (let lonI = 0; lonI < divisions; lonI++) {
        const lon0 = Phaser.Math.Linear(-Math.PI, Math.PI, lonI / divisions);
        const lon1 = Phaser.Math.Linear(-Math.PI, Math.PI, (lonI + 1) / divisions);

        const cellcolour = toColour(colourGrid[latI][lonI]);
        tiles.fillStyle(cellcolour, 1);

        for (let a = 0; a < sub; a++) {
          const t0 = a / sub;
          const t1 = (a + 1) / sub;
          const latA0 = Phaser.Math.Linear(lat0, lat1, t0);
          const latA1 = Phaser.Math.Linear(lat0, lat1, t1);

          for (let b = 0; b < sub; b++) {
            const u0 = b / sub;
            const u1 = (b + 1) / sub;
            const lonB0 = Phaser.Math.Linear(lon0, lon1, u0);
            const lonB1 = Phaser.Math.Linear(lon0, lon1, u1);

            const p00 = this.project(r, latA0, lonB0, rotate);
            const p01 = this.project(r, latA0, lonB1, rotate);
            const p11 = this.project(r, latA1, lonB1, rotate);
            const p10 = this.project(r, latA1, lonB0, rotate);

            const zAvg = (p00.z + p01.z + p11.z + p10.z) / 4;
            if (zAvg < 0) {
              continue;
            }

            tiles.beginPath();
            tiles.moveTo(p00.x, p00.y);
            tiles.lineTo(p01.x, p01.y);
            tiles.lineTo(p11.x, p11.y);
            tiles.lineTo(p10.x, p10.y);
            tiles.closePath();
            tiles.fillPath();
          }
        }
      }
    }

    const grid = scene.add.graphics();
    grid.lineStyle(3, 0x000000, 0.35);
    this.add(grid);

    const samples = 160;
    const drawCurve = (points: { x: number, y: number, z: number }[]) => {
      let drawing = false;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.z >= 0) {
          if (!drawing) {
            grid.beginPath();
            grid.moveTo(p.x, p.y);
            drawing = true;
          } else {
            grid.lineTo(p.x, p.y);
          }
        } else if (drawing) {
          grid.strokePath();
          drawing = false;
        }
      }
      if (drawing) {
        grid.strokePath();
      }
    }

    for (let i = 0; i <= divisions; i++) {
      const lon = -Math.PI + (i / divisions) * (2 * Math.PI);

      const pts: { x: number, y: number, z: number }[] = [];
      for (let s = 0; s <= samples; s++) {
        const lat = -Math.PI / 2 + (s / samples) * Math.PI;
        pts.push(this.project(r, lat, lon, rotate));
      }
      drawCurve(pts);
    }

    for (let i = 1; i < divisions; i++) {
      const lat = -Math.PI / 2 + (i / divisions) * Math.PI;

      const pts: { x: number, y: number, z: number }[] = [];
      for (let s = 0; s <= samples; s++) {
        const lon = -Math.PI + (s / samples) * (2 * Math.PI);
        pts.push(this.project(r, lat, lon, rotate));
      }
      drawCurve(pts);
    }
  }

  private project(
    r: number,
    lat: number,
    lon: number,
    rotate: (x: number, y: number, z: number) => { x: number, y: number, z: number }
  ) {
    const px = r * Math.cos(lat) * Math.sin(lon);
    const py = r * Math.sin(lat);
    const pz = r * Math.cos(lat) * Math.cos(lon);
    return rotate(px, py, pz);
  }

  private generateColours(colours: string[][] | undefined, divisions: number) {
    const out: string[][] = [];
    for (let i = 0; i < divisions; i++) {
      out[i] = [];
      for (let j = 0; j < divisions; j++) {
        const v = colours?.[i]?.[j];
        out[i][j] = typeof v === "string" && v.startsWith("#") ? v : this.randomHex();
      }
    }
    return out;
  }

  private randomHex() {
    const n = Phaser.Math.Between(0, 0xffffff);
    return "#" + n.toString(16).padStart(6, "0");
  }
}
