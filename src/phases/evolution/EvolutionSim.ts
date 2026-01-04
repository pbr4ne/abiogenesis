import Phaser from "phaser";
import PlanetRunState from "../../planet/PlanetRunState";
import { LifeFormDef, LifeFormInstance, LifeFormType } from "./EvolutionTypes";
import { LIFEFORMS } from "./LifeForms";

type SimTuning = {
  tickMs: number;

  baseMutationPerTick: number;
  baseReproPerTick: number;
  baseRandomDeathPerTick: number;

  baseAttackPerNeighbor: number;
  attackKillChance: number;
};

const DEFAULT_TUNING: SimTuning = {
  tickMs: 1000,

  baseMutationPerTick: 0.02,
  baseReproPerTick: 0.02,
  baseRandomDeathPerTick: 0.01,

  baseAttackPerNeighbor: 0.03,
  attackKillChance: 0.6
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const keyOf = (r: number, c: number) => `${r},${c}`;

const wrap = (v: number, max: number) => {
  let x = v % max;
  if (x < 0) x += max;
  return x;
};

const weightedPick = <T>(rng: Phaser.Math.RandomDataGenerator, items: { item: T; w: number }[]) => {
  let total = 0;
  for (const it of items) total += Math.max(0, it.w);
  if (total <= 0) return null;

  let roll = rng.frac() * total;
  for (const it of items) {
    const w = Math.max(0, it.w);
    roll -= w;
    if (roll <= 0) return it.item;
  }
  return items[items.length - 1].item;
};

export default class EvolutionSim {
  private run: PlanetRunState;
  private rng: Phaser.Math.RandomDataGenerator;
  private tuning: SimTuning;
  private divisions: number;

  constructor(run: PlanetRunState, divisions: number, tuning?: Partial<SimTuning>) {
    this.run = run;
    this.divisions = divisions;
    this.tuning = { ...DEFAULT_TUNING, ...(tuning ?? {}) };
    this.rng = new Phaser.Math.RandomDataGenerator([run.seed, "evolution"]);
  }

  public tick() {
    if (this.run.lifeForms.length === 0) return;

    const byCell = new Map<string, LifeFormInstance>();
    for (const lf of this.run.lifeForms) byCell.set(keyOf(lf.row, lf.col), lf);

    const alive = new Set<string>(this.run.lifeForms.map(l => l.id));

    const deaths = new Set<string>();
    const mutations = new Map<string, LifeFormType>();
    const births: { row: number; col: number; type: LifeFormType }[] = [];

    const rows = this.divisions;
    const cols = this.divisions;

    const neighborDeltas = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],       [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ] as const;

    const getNeighbors = (lf: LifeFormInstance) => {
      const out: LifeFormInstance[] = [];
      for (const [dr, dc] of neighborDeltas) {
        const nr = wrap(lf.row + dr, rows);
        const nc = wrap(lf.col + dc, cols);
        const n = byCell.get(keyOf(nr, nc));
        if (n) out.push(n);
      }
      return out;
    };

    const emptyNeighborCells = (lf: LifeFormInstance) => {
      const out: { row: number; col: number }[] = [];
      for (const [dr, dc] of neighborDeltas) {
        const nr = wrap(lf.row + dr, rows);
        const nc = wrap(lf.col + dc, cols);
        if (!byCell.has(keyOf(nr, nc))) out.push({ row: nr, col: nc });
      }
      return out;
    };

    const mutationChance = (lf: LifeFormInstance) =>
      clamp01(this.tuning.baseMutationPerTick * lf.mutationRate);

    const reproChance = (lf: LifeFormInstance) =>
      clamp01(this.tuning.baseReproPerTick * lf.reproductionRate);

    const randomDeathChance = (lf: LifeFormInstance) => {
      const survive01 = clamp01(lf.survivalRate / 100);
      return clamp01(this.tuning.baseRandomDeathPerTick * (1 - survive01));
    };

    const attackChanceAgainst = (attacker: LifeFormInstance) => {
      const survive01 = clamp01(attacker.survivalRate / 100);
      return clamp01(this.tuning.baseAttackPerNeighbor * (1 + 0.5 * (1 - survive01)));
    };

    for (const lf of this.run.lifeForms) {
      if (!alive.has(lf.id)) continue;

      if (this.rng.frac() < randomDeathChance(lf)) {
        deaths.add(lf.id);
        alive.delete(lf.id);
        continue;
      }

      const neighbors = getNeighbors(lf);
      if (neighbors.length > 0) {
        for (const other of neighbors) {
          if (!alive.has(lf.id) || !alive.has(other.id)) continue;
          if (other.type === lf.type) continue;

          if (this.rng.frac() < attackChanceAgainst(lf)) {
            const defenderSurvive01 = clamp01(other.survivalRate / 100);
            const killChance = clamp01(this.tuning.attackKillChance * (1 - 0.75 * defenderSurvive01));
            if (this.rng.frac() < killChance) {
              deaths.add(other.id);
              alive.delete(other.id);
            }
          }
        }
      }

      if (!alive.has(lf.id)) continue;

      const def = LIFEFORMS[lf.type];
      if (def.mutatesTo.length > 0 && this.rng.frac() < mutationChance(lf)) {
        const options = def.mutatesTo
          .map(t => ({ item: t, w: 1 / Math.max(1, LIFEFORMS[t].rarity) }));
        const pick = weightedPick(this.rng, options);
        if (pick) mutations.set(lf.id, pick);
      }

      if (this.rng.frac() < reproChance(lf)) {
        const empties = emptyNeighborCells(lf);
        if (empties.length > 0) {
          const spot = empties[this.rng.between(0, empties.length - 1)];
          births.push({ row: spot.row, col: spot.col, type: lf.type });
          byCell.set(keyOf(spot.row, spot.col), lf);
        }
      }
    }

    if (deaths.size > 0) {
      this.run.lifeForms = this.run.lifeForms.filter(lf => !deaths.has(lf.id));
    }

    if (mutations.size > 0) {
      for (const lf of this.run.lifeForms) {
        const to = mutations.get(lf.id);
        if (!to) continue;
        lf.type = to;
        lf.mutationRate = 0;
        lf.reproductionRate = 0;
        lf.survivalRate = 0;
      }
    }

    if (births.length > 0) {
      for (const b of births) {
        this.run.lifeForms.push({
          id: this.run.makeLifeId(),
          type: b.type,
          mutationRate: 0,
          reproductionRate: 0,
          survivalRate: 0,
          row: b.row,
          col: b.col
        });
      }
    }
  }

  public getTuning() {
    return this.tuning;
  }
}
