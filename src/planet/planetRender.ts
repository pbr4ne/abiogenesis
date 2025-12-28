import Phaser from "phaser";
import { Rotator, projectLatLon, latForIndex, lonForIndex } from "./sphereMath";
import { toPhaserColour } from "./colourGrid";

export const drawBaseGradient = (g: Phaser.GameObjects.Graphics, r: number) => {
  g.clear();

  const layers = 110;
  const inner = Phaser.Display.Color.ValueToColor(0x656057);
  const outer = Phaser.Display.Color.ValueToColor(0x35312c);

  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const rad = r * (1 - t * 0.02);

    const c = Phaser.Display.Color.Interpolate.ColorWithColor(inner, outer, 1, t);
    const col = Phaser.Display.Color.GetColor(c.r, c.g, c.b);

    g.fillStyle(col, 1);
    g.fillCircle(0, 0, rad);
  }

  const lx = -r * 0.20;
  const ly = -r * 0.20;
  const lDist = Math.sqrt(lx * lx + ly * ly);
  const lRad = (r - lDist) * 0.98;

  for (let i = 0; i < 34; i++) {
    const t = i / 33;
    const rad = lRad * (1 - t);
    const a = 0.07 * Math.pow(1 - t, 2.3);

    g.fillStyle(0xffffff, a);
    g.fillCircle(lx, ly, rad);
  }

  for (let i = 0; i < 40; i++) {
    const t = i / 39;
    const rad = r * (0.74 + t * 0.26);
    const a = 0.006 + 0.014 * t;

    g.fillStyle(0x000000, a);
    g.fillCircle(0, 0, rad);
  }
};

export const drawTiles = (
  g: Phaser.GameObjects.Graphics,
  r: number,
  divisions: number,
  sub: number,
  rotate: Rotator,
  colours: string[][],
  revealed: boolean[][],
) => {
  g.clear();

  for (let latI = 0; latI < divisions; latI++) {
    const lat0 = latForIndex(latI, divisions);
    const lat1 = latForIndex(latI + 1, divisions);

    for (let lonI = 0; lonI < divisions; lonI++) {
      if (!revealed[latI][lonI]) {
        continue;
      }

      const lon0 = lonForIndex(lonI, divisions);
      const lon1 = lonForIndex(lonI + 1, divisions);

      g.fillStyle(toPhaserColour(colours[latI][lonI]), 1);

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

          const p00 = projectLatLon(r, latA0, lonB0, rotate);
          const p01 = projectLatLon(r, latA0, lonB1, rotate);
          const p11 = projectLatLon(r, latA1, lonB1, rotate);
          const p10 = projectLatLon(r, latA1, lonB0, rotate);

          const zAvg = (p00.z + p01.z + p11.z + p10.z) / 4;
          if (zAvg < 0) {
            continue;
          }

          g.beginPath();
          g.moveTo(p00.x, p00.y);
          g.lineTo(p01.x, p01.y);
          g.lineTo(p11.x, p11.y);
          g.lineTo(p10.x, p10.y);
          g.closePath();
          g.fillPath();
        }
      }
    }
  }
};

export const drawWireGrid = (
  g: Phaser.GameObjects.Graphics,
  r: number,
  divisions: number,
  samples: number,
  lineWidth: number,
  lineAlpha: number,
  rotate: Rotator,
) => {
  g.clear();
  g.lineStyle(lineWidth, 0x000000, lineAlpha);

  const drawCurveFrontOnly = (pts: { x: number; y: number; z: number; }[]) => {
    let drawing = false;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];

      if (p.z >= 0) {
        if (!drawing) {
          g.beginPath();
          g.moveTo(p.x, p.y);
          drawing = true;
        } else {
          g.lineTo(p.x, p.y);
        }
      } else if (drawing) {
        g.strokePath();
        drawing = false;
      }
    }

    if (drawing) {
      g.strokePath();
    }
  };

  for (let i = 0; i <= divisions; i++) {
    const lon = lonForIndex(i, divisions);

    const pts: { x: number; y: number; z: number; }[] = [];
    for (let s = 0; s <= samples; s++) {
      const lat = Phaser.Math.Linear(-Math.PI / 2, Math.PI / 2, s / samples);
      pts.push(projectLatLon(r, lat, lon, rotate));
    }
    drawCurveFrontOnly(pts);
  }

  for (let i = 1; i < divisions; i++) {
    const lat = latForIndex(i, divisions);

    const pts: { x: number; y: number; z: number; }[] = [];
    for (let s = 0; s <= samples; s++) {
      const lon = Phaser.Math.Linear(-Math.PI, Math.PI, s / samples);
      pts.push(projectLatLon(r, lat, lon, rotate));
    }
    drawCurveFrontOnly(pts);
  }
};
