import Phaser from "phaser";
import { LifeFormInstance, LifeFormType } from "./EvolutionTypes";
import { LIFEFORMS } from "./LifeForms";

export const computeDepthByType = () => {
  const types = Object.keys(LIFEFORMS) as LifeFormType[];

  const indeg = new Map<LifeFormType, number>();
  for (const t of types) indeg.set(t, 0);

  for (const t of types) {
    for (const to of LIFEFORMS[t].mutatesTo) {
      indeg.set(to, (indeg.get(to) ?? 0) + 1);
    }
  }

  const roots = types.filter(t => (indeg.get(t) ?? 0) === 0);
  const depth = new Map<LifeFormType, number>();
  const q: LifeFormType[] = [];

  for (const r of roots) {
    depth.set(r, 0);
    q.push(r);
  }

  while (q.length > 0) {
    const cur = q.shift()!;
    const d = depth.get(cur) ?? 0;

    for (const to of LIFEFORMS[cur].mutatesTo) {
      const nd = d + 1;
      const prev = depth.get(to);
      if (prev === undefined || nd > prev) {
        depth.set(to, nd);
        q.push(to);
      }
    }
  }

  for (const t of types) {
    if (!depth.has(t)) depth.set(t, 0);
  }

  return depth;
};

export const scoreByType100 = (lifeForms: LifeFormInstance[]) => {
  const PERFECT_LF_FOR_100 = 12;
  const BASE_TARGET_POINTS = PERFECT_LF_FOR_100 * 15;

  const depthByType = computeDepthByType();
  let maxDepth = 0;
  for (const d of depthByType.values()) maxDepth = Math.max(maxDepth, d);
  if (maxDepth <= 0) maxDepth = 1;

  const sumByType = new Map<LifeFormType, number>();

  for (const lf of lifeForms) {
    const sum15 =
      (lf.mutationRate ?? 0) +
      (lf.reproductionRate ?? 0) +
      (lf.survivalRate ?? 0);

    sumByType.set(lf.type, (sumByType.get(lf.type) ?? 0) + sum15);
  }

  const out = new Map<LifeFormType, number>();

  for (const [type, total] of sumByType) {
    const depth = depthByType.get(type) ?? 0;
    const t = Phaser.Math.Clamp(depth / maxDepth, 0, 1);

    const targetMult = Phaser.Math.Linear(2.2, 1.0, t);
    const targetPoints = BASE_TARGET_POINTS * targetMult;

    const score100 = Phaser.Math.Clamp(Math.round((total / targetPoints) * 100), 0, 100);
    out.set(type, score100);
  }

  return out;
};
