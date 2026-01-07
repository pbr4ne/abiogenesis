import { LifeFormType } from "../phases/evolution/EvolutionTypes";

export type GalaxyMemoryState = {
  pendingPlanetId: string | null;
  completed: Record<string, LifeFormType>;
};

export const GalaxyMemory: GalaxyMemoryState = {
  pendingPlanetId: null,
  completed: {}
};
