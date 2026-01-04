import Phaser from "phaser";
import { Rotator, projectLatLon, latForIndex, lonForIndex, projectCellCorners } from "./PlanetMath";
import type { RGBA } from "./PlanetGrid";

export const drawBaseGradient = (g: Phaser.GameObjects.Graphics, r: number, centerY: number) => {
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
    g.fillCircle(0, centerY, rad);
  }

  const lx = -r * 0.20;
  const ly = centerY - r * 0.20;
  const lDist = Math.sqrt(lx * lx + (ly - centerY) * (ly - centerY));
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
    g.fillCircle(0, centerY, rad);
  }
};

export const drawTiles = (
  g: Phaser.GameObjects.Graphics,
  r: number,
  divisions: number,
  sub: number,
  rotate: Rotator,
  cells: RGBA[][],
) => {
  g.clear();

  for (let latI = 0; latI < divisions; latI++) {
    const lat0 = latForIndex(latI, divisions);
    const lat1 = latForIndex(latI + 1, divisions);

    for (let lonI = 0; lonI < divisions; lonI++) {
      const cell = cells[latI][lonI];
      if (cell.a <= 0) continue;

      const lon0 = lonForIndex(lonI, divisions);
      const lon1 = lonForIndex(lonI + 1, divisions);

      const fillCol = Phaser.Display.Color.GetColor(cell.r, cell.g, cell.b);
      g.fillStyle(fillCol, cell.a);

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

const shadeHex = (hex: number, mul: number) => {
  const r = Math.max(0, Math.min(255, Math.round(((hex >> 16) & 0xff) * mul)));
  const g = Math.max(0, Math.min(255, Math.round(((hex >> 8) & 0xff) * mul)));
  const b = Math.max(0, Math.min(255, Math.round((hex & 0xff) * mul)));
  return (r << 16) | (g << 8) | b;
};

const fillQuad = (g: Phaser.GameObjects.Graphics, a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }) => {
  g.beginPath();
  g.moveTo(a.x, a.y);
  g.lineTo(b.x, b.y);
  g.lineTo(c.x, c.y);
  g.lineTo(d.x, d.y);
  g.closePath();
  g.fillPath();
};

export const drawCellBump = (
  g: Phaser.GameObjects.Graphics,
  row: number,
  col: number,
  r: number,
  divisions: number,
  rotate: Rotator,
  baseHex: number,
  heightPx: number,
  alpha = 1
) => {
  const base = projectCellCorners(row, col, r, divisions, rotate);
  if (!base) return;

  const latC = latForIndex(row, divisions) * 0.5 + latForIndex(row + 1, divisions) * 0.5;
  const lonC = lonForIndex(col, divisions) * 0.5 + lonForIndex(col + 1, divisions) * 0.5;

  const c = projectLatLon(1, latC, lonC, rotate);
  if (c.z <= 0) return;

  const cx = c.x * r;
  const cy = c.y * r;

  const nLen = Math.sqrt(cx * cx + cy * cy) || 1;
  const nx = cx / nLen;
  const ny = cy / nLen;

  const offX = nx * heightPx;
  const offY = ny * heightPx;

  const top = base.map(p => ({ x: p.x + offX, y: p.y + offY }));

  const topCol = shadeHex(baseHex, 1.10);
  const sideDark = shadeHex(baseHex, 0.55);
  const sideLight = shadeHex(baseHex, 0.80);

  for (let i = 0; i < 4; i++) {
    const j = (i + 1) & 3;

    const a = base[i];
    const b = base[j];
    const d = top[i];
    const c2 = top[j];

    const edgeNx = (a.x + b.x) * 0.5;
    const edgeNy = (a.y + b.y) * 0.5;
    const edgeLen = Math.sqrt(edgeNx * edgeNx + edgeNy * edgeNy) || 1;
    const ex = edgeNx / edgeLen;
    const ey = edgeNy / edgeLen;

    const facing = ex * nx + ey * ny;
    const sideCol = facing > 0 ? sideLight : sideDark;

    g.fillStyle(sideCol, alpha);
    fillQuad(g, a, b, c2, d);
  }

  g.fillStyle(topCol, alpha);
  g.beginPath();
  g.moveTo(top[0].x, top[0].y);
  g.lineTo(top[1].x, top[1].y);
  g.lineTo(top[2].x, top[2].y);
  g.lineTo(top[3].x, top[3].y);
  g.closePath();
  g.fillPath();

  g.beginPath();
  g.moveTo(top[0].x, top[0].y);
  g.lineTo(top[1].x, top[1].y);
  g.lineTo(top[2].x, top[2].y);
  g.lineTo(top[3].x, top[3].y);
  g.closePath();
  g.strokePath();
};
