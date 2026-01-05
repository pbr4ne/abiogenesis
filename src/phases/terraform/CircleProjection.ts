import { Rotator, Vec3 } from "../../planet/PlanetMath";

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const dot3 = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const len3 = (v: Vec3) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
export const add3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const scale3 = (v: Vec3, s: number): Vec3 => ({ x: v.x * s, y: v.y * s, z: v.z * s });
export const sub3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

export const norm3 = (v: Vec3): Vec3 => {
  const l = len3(v);
  if (l <= 1e-9) return { x: 0, y: 0, z: 1 };
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};

export const cross3 = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x
});

const smallCirclePointOnUnitSphere = (centerUnit: Vec3, angRad: number, t: number): Vec3 => {
  const up = Math.abs(centerUnit.y) < 0.95 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const u = norm3(cross3(up, centerUnit));
  const v = cross3(centerUnit, u);

  const ct = Math.cos(t);
  const st = Math.sin(t);

  const cosA = Math.cos(angRad);
  const sinA = Math.sin(angRad);

  const ring = add3(scale3(u, ct), scale3(v, st));
  return add3(scale3(centerUnit, cosA), scale3(ring, sinA));
};

export const strokeProjectedSphereCircle = (
  g: Phaser.GameObjects.Graphics,
  r: number,
  centerUnit: Vec3,
  angRad: number,
  rotate: Rotator,
  lineW: number,
  hex: number,
  alpha: number,
  steps = 96
) => {
  let started = false;

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const pUnit = smallCirclePointOnUnitSphere(centerUnit, angRad, t);
    const p = rotate(pUnit.x * r, pUnit.y * r, pUnit.z * r);

    if (p.z <= 0) {
      if (started) {
        g.strokePath();
        started = false;
      }
      continue;
    }

    if (!started) {
      g.lineStyle(lineW, hex, alpha);
      g.beginPath();
      g.moveTo(p.x, p.y);
      started = true;
    } else {
      g.lineTo(p.x, p.y);
    }
  }

  if (started) g.strokePath();
};
