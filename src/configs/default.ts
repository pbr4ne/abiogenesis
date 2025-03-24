import { BlipsConfig } from '../utilities/types';

export const defaultConfig: BlipsConfig = {
  redInitial: 256,
  greenInitial: 256,
  blueInitial: 256,

  redGrowRate: 0.15,
  redEatRate: 0.5,
  redDieRate: 0.1,
  redStarveRate: 0.05,
  redGrowSelfRate: 0.5,
  redGrowOtherRate: 0.5,

  blueGrowRate: 0.5,
  blueEatRate: 1.0,
  blueDieRate: 0.1,
  blueStarveRate: 0.5,
  blueGrowSelfRate: 0.5,
  blueGrowOtherRate: 0.5,
  blueEatenSelfRate: 0.5,
  blueEatenOtherRate: 0.5,

  greenGrowRate: 0.85,
  greenDieRate: 0.1,
  greenGrowSelfRate: 0.5,
  greenGrowOtherRate: 0.5,
  greenEatenSelfRate: 0.5,
  greenEatenOtherRate: 0.5,
};
