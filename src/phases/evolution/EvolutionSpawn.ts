import type PlanetRunState from "../../planet/PlanetRunState";
import { LifeFormInstance } from "./EvolutionTypes";

const POLE_ROWS = 7;

const isPolarRow = (row: number, rows: number) =>
  row < POLE_ROWS || row >= (rows - POLE_ROWS);

const pickRandomWaterCells = (divisions: number, isWater: (r: number, c: number) => boolean, count: number) => {
  const cells: { row: number; col: number }[] = [];
  for (let row = 0; row < divisions; row++) {
    if (isPolarRow(row, divisions)) continue;

    for (let col = 0; col < divisions; col++) {
      if (isWater(row, col)) cells.push({ row, col });
    }
  }

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  return cells.slice(0, Math.min(count, cells.length));
};

export const ensureStartingProkaryotes = (
  run: PlanetRunState,
  divisions: number,
  isWaterCell: (row: number, col: number) => boolean,
  numProkaryotes: number
) => {
  if (run.lifeForms.length > 0) return;

  const spots = pickRandomWaterCells(divisions, isWaterCell, numProkaryotes);

  for (const s of spots) {
    const lf: LifeFormInstance = {
      id: run.makeLifeId(),
      type: "prokaryote",
      mutationRate: 1,
      reproductionRate: 1,
      survivalRate: 1,
      row: s.row,
      col: s.col
    };
    run.lifeForms.push(lf);
  }
};
