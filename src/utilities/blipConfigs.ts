import { BlipConfig } from './types';

const defaultConfig: BlipConfig = {
  id: 'default',
  name: 'Default',
  
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

const aggressiveConfig: BlipConfig = {
  id: 'aggressive',
  name: 'Aggressive',
  
  redInitial: 128,
  greenInitial: 128,
  blueInitial: 128,

  redGrowRate: 0.3,
  redEatRate: 0.8,
  redDieRate: 0.15,
  redStarveRate: 0.1,
  redGrowSelfRate: 0.6,
  redGrowOtherRate: 0.4,

  blueGrowRate: 0.7,
  blueEatRate: 1.2,
  blueDieRate: 0.2,
  blueStarveRate: 0.7,
  blueGrowSelfRate: 0.6,
  blueGrowOtherRate: 0.4,
  blueEatenSelfRate: 0.7,
  blueEatenOtherRate: 0.7,

  greenGrowRate: 0.6,
  greenDieRate: 0.2,
  greenGrowSelfRate: 0.6,
  greenGrowOtherRate: 0.4,
  greenEatenSelfRate: 0.6,
  greenEatenOtherRate: 0.6,
};

export const blipConfigs = { 
  'default': defaultConfig, 
  'aggressive': aggressiveConfig 
} as const;