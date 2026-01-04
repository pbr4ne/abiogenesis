import { LifeFormType, LifeFormDef } from "./EvolutionTypes";
import { LIFEFORMS } from "./LifeForms";

const buildParentsMap = (defs: Record<LifeFormType, LifeFormDef>) => {
  const parents = new Map<LifeFormType, Set<LifeFormType>>();
  for (const key of Object.keys(defs) as LifeFormType[]) {
    parents.set(key, new Set());
  }
  for (const from of Object.keys(defs) as LifeFormType[]) {
    for (const to of defs[from].mutatesTo) {
      parents.get(to)!.add(from);
    }
  }
  return parents;
};

const PARENTS = buildParentsMap(LIFEFORMS);

export const canMutateTo = (from: LifeFormType, to: LifeFormType) =>
  LIFEFORMS[from].mutatesTo.includes(to);

export const getDirectMutations = (from: LifeFormType) =>
  LIFEFORMS[from].mutatesTo.slice();

export const getAncestors = (type: LifeFormType) => {
  const out: LifeFormType[] = [];
  const seen = new Set<LifeFormType>();
  const stack: LifeFormType[] = [...(PARENTS.get(type) ?? [])];

  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    out.push(cur);
    for (const p of PARENTS.get(cur) ?? []) stack.push(p);
  }
  return out;
};

export const getDescendants = (type: LifeFormType) => {
  const out: LifeFormType[] = [];
  const seen = new Set<LifeFormType>();
  const stack: LifeFormType[] = [...LIFEFORMS[type].mutatesTo];

  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    out.push(cur);
    for (const child of LIFEFORMS[cur].mutatesTo) stack.push(child);
  }
  return out;
};

export const isEarlierInBranch = (earlier: LifeFormType, later: LifeFormType) =>
  getAncestors(later).includes(earlier);

export const shareBranch = (a: LifeFormType, b: LifeFormType) => {
  if (a === b) return true;
  const aAnc = new Set(getAncestors(a).concat([a]));
  const bAnc = new Set(getAncestors(b).concat([b]));
  for (const x of aAnc) if (bAnc.has(x)) return true;
  return false;
};

export const lowestCommonAncestor = (a: LifeFormType, b: LifeFormType) => {
  const aChain = [a, ...getAncestors(a)];
  const bSet = new Set([b, ...getAncestors(b)]);
  for (const x of aChain) if (bSet.has(x)) return x;
  return null as LifeFormType | null;
};
