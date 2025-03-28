export interface Blip {
  r: number;
  g: number;
  b: number;
}

export interface BlipConfig {
  id: string;
  name: string;

  redInitial: number;
  greenInitial: number;
  blueInitial: number;

  redGrowRate: number;
  redEatRate: number;
  redDieRate: number;
  redStarveRate: number;
  redGrowSelfRate: number;
  redGrowOtherRate: number;

  blueGrowRate: number;
  blueEatRate: number;
  blueDieRate: number;
  blueStarveRate: number;
  blueGrowSelfRate: number;
  blueGrowOtherRate: number;
  blueEatenSelfRate: number;
  blueEatenOtherRate: number;

  greenGrowRate: number;
  greenDieRate: number;
  greenGrowSelfRate: number;
  greenGrowOtherRate: number;
  greenEatenSelfRate: number;
  greenEatenOtherRate: number;
}

export interface GameState {
  currentConfig: BlipConfig;
  configs: Record<string, BlipConfig>;
}
