import Phaser from "phaser";

export type Vec2 = { x: number; y: number; };
export type Vec3 = { x: number; y: number; z: number; };

export type Rotator = (x: number, y: number, z: number) => Vec3;

export const makeRotator = (tiltRad: number, yawRad: number): Rotator => {
  const ct = Math.cos(tiltRad);
  const st = Math.sin(tiltRad);
  const cy = Math.cos(yawRad);
  const sy = Math.sin(yawRad);

  return (px: number, py: number, pz: number) => {
    const x1 = px * cy + pz * sy;
    const z1 = -px * sy + pz * cy;

    const y2 = py * ct - z1 * st;
    const z2 = py * st + z1 * ct;

    return { x: x1, y: y2, z: z2 };
  };
};

export const latLonToXYZ = (r: number, lat: number, lon: number): Vec3 => {
  const x = r * Math.cos(lat) * Math.sin(lon);
  const y = r * Math.sin(lat);
  const z = r * Math.cos(lat) * Math.cos(lon);
  return { x, y, z };
};

export const projectLatLon = (r: number, lat: number, lon: number, rotate: Rotator): Vec3 => {
  const p = latLonToXYZ(r, lat, lon);
  return rotate(p.x, p.y, p.z);
};

export const latForIndex = (i: number, divisions: number) => {
  return Phaser.Math.Linear(-Math.PI / 2, Math.PI / 2, i / divisions);
};

export const lonForIndex = (i: number, divisions: number) => {
  return Phaser.Math.Linear(-Math.PI, Math.PI, i / divisions);
};

export const pickCellByNearestProjectedCenter = (
  dx: number,
  dy: number,
  r: number,
  divisions: number,
  rotate: Rotator
): { row: number; col: number } | null => {
  const nx = dx / r;
  const ny = dy / r;

  if (nx * nx + ny * ny > 1) return null;

  let bestRow = 0;
  let bestCol = 0;
  let bestD2 = Number.POSITIVE_INFINITY;

  for (let row = 0; row < divisions; row++) {
    const v = (row + 0.5) / divisions;
    const lat = (v - 0.5) * Math.PI;

    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);

    for (let col = 0; col < divisions; col++) {
      const u = (col + 0.5) / divisions;
      const lon = (u - 0.5) * Math.PI * 2;

      const x = Math.sin(lon) * cosLat;
      const y = sinLat;
      const z = Math.cos(lon) * cosLat;

      const p = rotate(x, y, z);

      if (p.z <= 0) continue;

      const px = p.x;
      const py = p.y;

      const ddx = nx - px;
      const ddy = ny - py;
      const d2 = ddx * ddx + ddy * ddy;

      if (d2 < bestD2) {
        bestD2 = d2;
        bestRow = row;
        bestCol = col;
      }
    }
  }

  return { row: bestRow, col: bestCol };
}

export const projectCellCorners = (
  row: number,
  col: number,
  r: number,
  divisions: number,
  rotate: Rotator
): Vec2[] | null => {
  const lat0 = latForIndex(row, divisions);
  const lat1 = latForIndex(row + 1, divisions);
  const lon0 = lonForIndex(col, divisions);
  const lon1 = lonForIndex(col + 1, divisions);

  const p00 = projectLatLon(1, lat0, lon0, rotate);
  const p01 = projectLatLon(1, lat0, lon1, rotate);
  const p11 = projectLatLon(1, lat1, lon1, rotate);
  const p10 = projectLatLon(1, lat1, lon0, rotate);

  if (p00.z <= 0 && p01.z <= 0 && p11.z <= 0 && p10.z <= 0) return null;

  return [
    { x: p00.x * r, y: p00.y * r },
    { x: p01.x * r, y: p01.y * r },
    { x: p11.x * r, y: p11.y * r },
    { x: p10.x * r, y: p10.y * r }
  ];
};
