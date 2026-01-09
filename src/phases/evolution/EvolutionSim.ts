import Phaser from "phaser";
import PlanetRunState from "../../planet/PlanetRunState";
import { LifeFormInstance, LifeFormType } from "./EvolutionTypes";
import { LIFEFORMS } from "./LifeForms";
import { log } from "../../utilities/GameUtils";

type SimTuning = {
  tickMs: number;

  baseMutationPerTick: number;
  baseReproPerTick: number;
  baseRandomDeathPerTick: number;

  baseAttackPerNeighbor: number;
  attackKillChance: number;

  pointsBasePerTick: number;
  pointsPerLifePerTick: number;
  pointsPerDepthPerTick: number;

  baseWildSpawnPerTick: number;
  wildSpawnReproMul: number;
  wildSpawnMaxPerTick: number;

  maxAttacksPerTick: number;
  newbornGraceTicks: number;
  depthReproMulPerDepth: number;
  depthRandomDeathReducePerDepth: number;
  depthKillReducePerDepth: number;
  depthReproQuadPerDepth: number;

  logEvents: boolean;
};

const DEFAULT_TUNING: SimTuning = {
  tickMs: 1000,

  baseMutationPerTick: 0.0035,
  baseReproPerTick: 0.008,
  baseRandomDeathPerTick: 0.001,

  baseAttackPerNeighbor: 0.015,
  attackKillChance: 0.35,

  pointsBasePerTick: 0.045,
  pointsPerLifePerTick: 0.012,
  pointsPerDepthPerTick: 0.012,

  baseWildSpawnPerTick: 0.01,
  wildSpawnReproMul: 0.18,
  wildSpawnMaxPerTick: 4,

  maxAttacksPerTick: 1,
  newbornGraceTicks: 16,
  depthReproMulPerDepth: 0.10,
  depthRandomDeathReducePerDepth: 0.03,
  depthKillReducePerDepth: 0.03,
  depthReproQuadPerDepth: 0.02,

  logEvents: false
};

const POLE_ROWS = 7;

const isPolarRow = (row: number, rows: number) =>
  row < POLE_ROWS || row >= (rows - POLE_ROWS);

const computeDepthByType = () => {
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

  private depthByType: Map<LifeFormType, number>;

  private tickN = 0;

  constructor(run: PlanetRunState, divisions: number, tuning?: Partial<SimTuning>) {
    this.run = run;
    this.divisions = divisions;
    this.tuning = { ...DEFAULT_TUNING, ...(tuning ?? {}) };
    this.rng = new Phaser.Math.RandomDataGenerator([run.seed, "evolution"]);
    this.depthByType = computeDepthByType();
  }

  public tick() {
    this.tickN++;

    if (this.run.lifeForms.length === 0) return;

    this.accumulatePoints();

    const byCell = new Map<string, LifeFormInstance>();
    const occupied = new Set<string>();

    for (const lf of this.run.lifeForms) {
      const k = keyOf(lf.row, lf.col);
      byCell.set(k, lf);
      occupied.add(k);
    }

    const alive = new Set<string>(this.run.lifeForms.map(l => l.id));

    const deaths = new Set<string>();
    const mutations = new Map<string, LifeFormType>();
    const births: { row: number; col: number; type: LifeFormType; reason: "repro" | "wild" }[] = [];

    const rows = this.divisions;
    const cols = this.divisions;

    const neighborDeltas = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ] as const;

    const depthOf = (t: LifeFormType) => this.depthByType.get(t) ?? 0;

    const isNewbornProtected = (lf: LifeFormInstance) => {
      const bt = (lf as any).bornTick as number | undefined;
      if (bt === undefined) return false;
      return (this.tickN - bt) < Math.max(0, this.tuning.newbornGraceTicks | 0);
    };

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
        const k = keyOf(nr, nc);
        if (occupied.has(k)) continue;
        if (!this.isValidTileForType(lf.type, nr, nc)) continue;
        out.push({ row: nr, col: nc });
      }
      return out;
    };

    const mutationChance = (lf: LifeFormInstance) =>
      clamp01(this.tuning.baseMutationPerTick * lf.mutationRate);

    const reproChance = (lf: LifeFormInstance) => {
      const d = depthOf(lf.type);
      const mul = 1 + this.tuning.depthReproMulPerDepth * d + this.tuning.depthReproQuadPerDepth * d * d;
      return clamp01(this.tuning.baseReproPerTick * lf.reproductionRate * mul);
    };

    const randomDeathChance = (lf: LifeFormInstance) => {
      const survive01 = clamp01(lf.survivalRate / 100);
      const d = depthOf(lf.type);

      const reduce = this.tuning.depthRandomDeathReducePerDepth * d;
      const mul = Math.max(0.2, 1 - reduce);

      return clamp01(this.tuning.baseRandomDeathPerTick * (1 - survive01) * mul);
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
        if (this.tuning.logEvents) log(`[evo] death random id=${lf.id} type=${lf.type} at=${lf.row},${lf.col}`);
        continue;
      }

      const enemies = getNeighbors(lf).filter(o =>
        alive.has(o.id) &&
        o.type !== lf.type
      );

      const maxAttacks = Math.max(0, this.tuning.maxAttacksPerTick | 0);

      for (let ai = 0; ai < maxAttacks; ai++) {
        if (!alive.has(lf.id)) break;
        if (enemies.length === 0) break;

        if (this.rng.frac() >= attackChanceAgainst(lf)) continue;

        const other = enemies[this.rng.between(0, enemies.length - 1)];
        if (!alive.has(other.id)) continue;

        if (isNewbornProtected(other)) continue;

        const defenderSurvive01 = clamp01(other.survivalRate / 100);

        const defDepth = depthOf(other.type);
        const depthReduce = Math.max(0, this.tuning.depthKillReducePerDepth * defDepth);
        const depthMul = Math.max(0.25, 1 - depthReduce);

        const killChance =
          clamp01(this.tuning.attackKillChance * (1 - 0.75 * defenderSurvive01) * depthMul);

        if (this.rng.frac() < killChance) {
          deaths.add(other.id);
          alive.delete(other.id);

          if (this.tuning.logEvents) {
            log(`[evo] death attack attacker=${lf.type}(${lf.id}) defender=${other.type}(${other.id}) at=${other.row},${other.col}`);
          }

          for (let i = enemies.length - 1; i >= 0; i--) {
            if (!alive.has(enemies[i].id)) enemies.splice(i, 1);
          }
        }
      }

      if (!alive.has(lf.id)) continue;

      const def = LIFEFORMS[lf.type];
      if (def.mutatesTo.length > 0 && this.rng.frac() < mutationChance(lf)) {
        const options = def.mutatesTo.map(t => ({
          item: t,
          w: 1 / Math.pow(Math.max(1, LIFEFORMS[t].rarity), 3)
        }));
        const pick = weightedPick(this.rng, options);
        if (pick) {
          mutations.set(lf.id, pick);
          if (this.tuning.logEvents) log(`[evo] mutate roll id=${lf.id} from=${lf.type} -> to=${pick}`);
        }
      }

      if (this.rng.frac() < reproChance(lf)) {
        const empties = emptyNeighborCells(lf);
        if (empties.length > 0) {
          const spot = empties[this.rng.between(0, empties.length - 1)];
          const k = keyOf(spot.row, spot.col);

          births.push({ row: spot.row, col: spot.col, type: lf.type, reason: "repro" });
          occupied.add(k);

          if (this.tuning.logEvents) {
            log(`[evo] birth repro parent=${lf.type}(${lf.id}) -> childType=${lf.type} at=${spot.row},${spot.col}`);
          }
        }
      }
    }

    this.applyWildSpawns(byCell, occupied, births);

    if (deaths.size > 0) {
      this.run.lifeForms = this.run.lifeForms.filter(lf => !deaths.has(lf.id));
    }

    if (mutations.size > 0) {
      const occupiedNow = new Set<string>();
      for (const lf of this.run.lifeForms) occupiedNow.add(keyOf(lf.row, lf.col));

      for (const lf of this.run.lifeForms) {
        const to = mutations.get(lf.id);
        if (!to) continue;

        const from = lf.type;
        lf.type = to;
        lf.mutationRate = 1;
        lf.reproductionRate = 1;
        lf.survivalRate = 1;

        (lf as any).bornTick = this.tickN;

        this.relocateIfNeeded(lf, occupiedNow);

        if (this.tuning.logEvents) {
          log(`[evo] mutate apply id=${lf.id} ${from} -> ${to} at=${lf.row},${lf.col}`);
        }
      }
    }

    if (births.length > 0) {
      for (const b of births) {
        this.run.lifeForms.push({
          id: this.run.makeLifeId(),
          type: b.type,
          mutationRate: 1,
          reproductionRate: 1,
          survivalRate: 1,
          row: b.row,
          col: b.col,
          bornTick: this.tickN
        } as any);
      }
    }

    this.run.unlockedLifeTypes ??= new Set<LifeFormType>();
    for (const lf of this.run.lifeForms) this.run.unlockedLifeTypes.add(lf.type);

    this.ensureMinProkaryotes(5);

    this.run.unlockedLifeTypes ??= new Set<LifeFormType>();
    for (const lf of this.run.lifeForms) this.run.unlockedLifeTypes.add(lf.type);

    if (this.tuning.logEvents) {
      if (births.length > 0 || deaths.size > 0 || mutations.size > 0) {
        log(`[evo] tick summary births=${births.length} deaths=${deaths.size} mutations=${mutations.size} total=${this.run.lifeForms.length}`);
      }
    }
  }

  private applyWildSpawns(
    byCell: Map<string, LifeFormInstance>,
    occupied: Set<string>,
    births: { row: number; col: number; type: LifeFormType; reason: "repro" | "wild" }[]
  ) {
    const logOn = !!this.tuning.logEvents;

    const maxPerTick = Math.max(0, this.tuning.wildSpawnMaxPerTick | 0);
    if (logOn) log(`[evo][wild] begin tick=${this.tickN} maxPerTick=${maxPerTick} lifeN=${this.run.lifeForms.length} occupiedN=${occupied.size}`);
    if (maxPerTick <= 0) {
      if (logOn) log(`[evo][wild] stop: maxPerTick<=0`);
      return;
    }

    const stats = new Map<LifeFormType, { n: number; reproSum: number }>();
    for (const lf of this.run.lifeForms) {
      const s = stats.get(lf.type) ?? { n: 0, reproSum: 0 };
      s.n++;
      s.reproSum += lf.reproductionRate;
      stats.set(lf.type, s);
    }

    if (stats.size === 0) {
      if (logOn) log(`[evo][wild] stop: stats.size===0`);
      return;
    }

    const excluded = new Set<LifeFormType>(["prokaryote", "eukaryote", "virus"] as LifeFormType[]);

    if (logOn) {
      const keys = Array.from(stats.entries()).map(([t, s]) => `${t}(n=${s.n})`).join(", ");
      log(`[evo][wild] statsTypes=${stats.size} excluded=${Array.from(excluded).join(",")} types=${keys}`);
    }

    let spawned = 0;

    const detailEvery = 30;
    const doDetail = logOn && (this.tickN % detailEvery === 0);

    let excludedHits = 0;
    let rollFailHits = 0;
    let noSpotHits = 0;
    let okRollHits = 0;

    for (const [type, s] of stats) {
      if (spawned >= maxPerTick) {
        if (logOn) log(`[evo][wild] stop: reached maxPerTick spawned=${spawned}/${maxPerTick}`);
        break;
      }

      if (excluded.has(type)) {
        excludedHits++;
        if (doDetail) log(`[evo][wild] skip type=${type} reason=excluded`);
        continue;
      }

      const avgRepro = s.n > 0 ? s.reproSum / s.n : 1;

      const chanceRaw =
        this.tuning.baseWildSpawnPerTick *
        (1 + this.tuning.wildSpawnReproMul * Math.max(0, avgRepro - 1));

      const chance = clamp01(chanceRaw);

      const roll = this.rng.frac();

      if (doDetail) {
        log(
          `[evo][wild] check type=${type} n=${s.n} avgRepro=${avgRepro.toFixed(2)} ` +
          `chanceRaw=${chanceRaw.toFixed(8)} chance=${chance.toFixed(8)} roll=${roll.toFixed(8)}`
        );
      }

      if (roll >= chance) {
        rollFailHits++;
        continue;
      }

      okRollHits++;

      const spot = this.pickRandomEmptyCellForType(occupied, type, 220);

      if (!spot) {
        noSpotHits++;
        if (doDetail) {
          const req = this.requiredHabitatForType(type);
          const hydro = this.run.hydroAlt ? "yes" : "no";
          log(`[evo][wild] fail type=${type} reason=noSpot reqHabitat=${req} hydroAlt=${hydro} occupiedN=${occupied.size}`);
        }
        continue;
      }

      const k = keyOf(spot.row, spot.col);
      births.push({ row: spot.row, col: spot.col, type, reason: "wild" });
      occupied.add(k);
      spawned++;

      if (logOn) {
        log(`[evo][wild] SPAWN type=${type} at=${spot.row},${spot.col} spawned=${spawned}/${maxPerTick}`);
      }
    }

    if (logOn) {
      log(
        `[evo][wild] end tick=${this.tickN} spawned=${spawned} ` +
        `excludedSkips=${excludedHits} rollFails=${rollFailHits} okRolls=${okRollHits} noSpot=${noSpotHits} ` +
        `detailEvery=${detailEvery}${doDetail ? " (detailed)" : ""}`
      );
    }
  }

  private tileHabitatAt(row: number, col: number): "land" | "sea" | null {
    if (!this.run.hydroAlt) return null;
    const v = this.run.hydroAlt[row]?.[col];
    if (v === undefined) return null;
    return v > this.run.waterLevel ? "land" : "sea";
  }

  private requiredHabitatForType(t: LifeFormType): "land" | "sea" | "any" {
    const hs = LIFEFORMS[t].habitats;
    const hasLand = hs.includes("land");
    const hasSea = hs.includes("sea");
    const hasAir = hs.includes("air");

    if (hasAir && !hasLand && !hasSea) return "any";
    if (hasLand && hasSea) return "any";
    if (hasLand) return "land";
    if (hasSea) return "sea";
    return "any";
  }

  private isValidTileForType(t: LifeFormType, row: number, col: number): boolean {
    const req = this.requiredHabitatForType(t);
    if (req === "any") return true;

    const h = this.tileHabitatAt(row, col);
    if (!h) return false;

    return h === req;
  }

  private findNearestValidEmptyTile(
    startRow: number,
    startCol: number,
    t: LifeFormType,
    occupied: Set<string>
  ): { row: number; col: number } | null {
    const req = this.requiredHabitatForType(t);
    if (req === "any") return { row: startRow, col: startCol };

    const rows = this.divisions;
    const cols = this.divisions;

    const startK = keyOf(startRow, startCol);
    const visited = new Set<string>([startK]);
    const q: { row: number; col: number }[] = [{ row: startRow, col: startCol }];

    const deltas = [
      [-1, 0], [1, 0],
      [0, -1], [0, 1]
    ] as const;

    while (q.length > 0) {
      const cur = q.shift()!;
      const k = keyOf(cur.row, cur.col);

      if (!occupied.has(k) && this.isValidTileForType(t, cur.row, cur.col)) return cur;

      for (const [dr, dc] of deltas) {
        const nr = wrap(cur.row + dr, rows);
        const nc = wrap(cur.col + dc, cols);
        const nk = keyOf(nr, nc);
        if (visited.has(nk)) continue;
        visited.add(nk);
        q.push({ row: nr, col: nc });
      }
    }

    return null;
  }

  private relocateIfNeeded(lf: LifeFormInstance, occupied: Set<string>) {
    if (this.requiredHabitatForType(lf.type) === "any") return;

    if (this.isValidTileForType(lf.type, lf.row, lf.col)) return;

    const oldK = keyOf(lf.row, lf.col);
    occupied.delete(oldK);

    const spot = this.findNearestValidEmptyTile(lf.row, lf.col, lf.type, occupied);
    if (spot) {
      lf.row = spot.row;
      lf.col = spot.col;
    }

    occupied.add(keyOf(lf.row, lf.col));
  }

  private pickRandomEmptyCellForType(occupied: Set<string>, t: LifeFormType, tries: number) {
    const rows = this.divisions;
    const cols = this.divisions;

    for (let i = 0; i < tries; i++) {
      const row = this.rng.between(0, rows - 1);
      if (isPolarRow(row, rows)) continue;

      const col = this.rng.between(0, cols - 1);

      const k = keyOf(row, col);
      if (occupied.has(k)) continue;
      if (!this.isValidTileForType(t, row, col)) continue;

      if (this.run.hydroAlt && this.run.hydroAlt[row]?.[col] === undefined) continue;

      return { row, col };
    }

    const spots: { row: number; col: number }[] = [];

    for (let row = 0; row < rows; row++) {
      if (isPolarRow(row, rows)) continue;

      for (let col = 0; col < cols; col++) {
        const k = keyOf(row, col);
        if (occupied.has(k)) continue;
        if (!this.isValidTileForType(t, row, col)) continue;
        if (this.run.hydroAlt && this.run.hydroAlt[row]?.[col] === undefined) continue;
        spots.push({ row, col });
      }
    }

    if (spots.length === 0) return null;
    return spots[this.rng.between(0, spots.length - 1)];
  }

  private ensureMinProkaryotes(minCount: number) {
    let cur = 0;
    for (const lf of this.run.lifeForms) {
      if (lf.type === "prokaryote") cur++;
    }

    const need = Math.max(0, minCount - cur);
    if (need <= 0) return;

    const byCell = new Set<string>();
    for (const lf of this.run.lifeForms) byCell.add(keyOf(lf.row, lf.col));

    const spots: { row: number; col: number }[] = [];

    for (let row = 0; row < this.divisions; row++) {
      if (isPolarRow(row, this.divisions)) continue;

      for (let col = 0; col < this.divisions; col++) {
        if (byCell.has(keyOf(row, col))) continue;
        if (this.run.hydroAlt?.[row]?.[col] === undefined) continue;
        if (this.run.hydroAlt[row][col] > this.run.waterLevel) continue;
        spots.push({ row, col });
      }
    }


    for (let i = spots.length - 1; i > 0; i--) {
      const j = this.rng.between(0, i);
      [spots[i], spots[j]] = [spots[j], spots[i]];
    }

    const take = Math.min(need, spots.length);

    for (let i = 0; i < take; i++) {
      const s = spots[i];

      this.run.lifeForms.push({
        id: this.run.makeLifeId(),
        type: "prokaryote",
        mutationRate: 1,
        reproductionRate: 1,
        survivalRate: 1,
        row: s.row,
        col: s.col,
        bornTick: this.tickN
      } as any);

      if (this.tuning.logEvents) log(`[evo] birth ensureMin type=prokaryote at=${s.row},${s.col}`);
    }

    this.run.unlockedLifeTypes ??= new Set<LifeFormType>();
    this.run.unlockedLifeTypes.add("prokaryote");
  }

  private accumulatePoints() {
    let depthSum = 0;
    for (const lf of this.run.lifeForms) {
      depthSum += this.depthByType.get(lf.type) ?? 0;
    }

    const n = this.run.lifeForms.length;

    const gain =
      this.tuning.pointsBasePerTick +
      n * this.tuning.pointsPerLifePerTick +
      depthSum * this.tuning.pointsPerDepthPerTick;

    this.run.addEvoPoints(gain);
  }

  public getTuning() {
    return this.tuning;
  }
}
