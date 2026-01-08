import PlanetRunState from "../planet/PlanetRunState";
import { GalaxyMemory, GalaxyMemoryState } from "./GalaxyMemory";

type GameSessionState = {
  run: PlanetRunState;
  galaxy: GalaxyMemoryState;
  runId: number;
};

export const getRun = () => {
  if (GameSession.run) return GameSession.run;

  GameSession.run = new PlanetRunState(40);
  GameSession.runId++;

  return GameSession.run;
};

export const GameSession: GameSessionState = {
  run: new PlanetRunState(40),
  galaxy: GalaxyMemory,
  runId: 1
};

export const resetRun = (seed?: string) => {
  GameSession.run = new PlanetRunState(40, seed);
  GameSession.runId++;
};

export const clearGalaxy = () => {
  GameSession.galaxy.pendingPlanetId = null;
  GameSession.galaxy.completed = {};
};
