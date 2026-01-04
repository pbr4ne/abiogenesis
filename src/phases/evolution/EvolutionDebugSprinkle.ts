import type PlanetRunState from "../../planet/PlanetRunState";
import type PlanetGrid from "../../planet/PlanetGrid";
import type { LifeFormType, LifeFormInstance } from "./EvolutionTypes";
import { LIFEFORMS } from "./LifeForms";

const keyOf = (row: number, col: number) => `${row},${col}`;

const pickRandomCells = (
  divisions: number,
  count: number,
  isAllowed: (row: number, col: number) => boolean,
  occupied: Set<string>
) => {
  const candidates: { row: number; col: number }[] = [];
  for (let row = 0; row < divisions; row++) {
    for (let col = 0; col < divisions; col++) {
      if (!isAllowed(row, col)) continue;
      const k = keyOf(row, col);
      if (occupied.has(k)) continue;
      candidates.push({ row, col });
    }
  }

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  return candidates.slice(0, Math.min(count, candidates.length));
};

export const sprinkleLifeFormsDebug = (
  run: PlanetRunState,
  divisions: number,
  hydroAlt: number[][],
  waterLevel: number,
  perType = 5
) => {
  run.lifeForms = [];
  const occupied = new Set<string>();

  const isSea = (row: number, col: number) => hydroAlt[row][col] <= waterLevel;
  const isLand = (row: number, col: number) => hydroAlt[row][col] > waterLevel;

  for (const type of Object.keys(LIFEFORMS) as LifeFormType[]) {
    const def = LIFEFORMS[type];

    const isAllowed = (row: number, col: number) => {
      const sea = isSea(row, col);
      const land = isLand(row, col);

      if (def.habitats.includes("sea") && sea) return true;
      if (def.habitats.includes("land") && land) return true;
      if (def.habitats.includes("air")) return true;
      return false;
    };

    const spots = pickRandomCells(divisions, perType, isAllowed, occupied);

    for (const s of spots) {
      occupied.add(keyOf(s.row, s.col));

      const lf: LifeFormInstance = {
        id: run.makeLifeId(),
        type,
        mutationRate: 0,
        reproductionRate: 0,
        survivalRate: 0,
        row: s.row,
        col: s.col
      };

      run.lifeForms.push(lf);
    }
  }
};
