import Phaser from "phaser";

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
