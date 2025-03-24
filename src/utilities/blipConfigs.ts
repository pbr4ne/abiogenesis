import { channel } from 'diagnostics_channel';
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

const chlorophyllConfig: BlipConfig = {
  id: 'chlorophyll',
  name: 'Chlorophyll',

  redInitial: 128,
  blueInitial: 179,
  greenInitial: 256,

  redGrowRate: 0.4,
  redEatRate: 0.9,
  redDieRate: 0.35,
  redStarveRate: 0.15,
  redGrowSelfRate: 0.2,
  redGrowOtherRate: 0.7,

  blueGrowRate: 0.5,
  blueEatRate: 1.3,
  blueDieRate: 0.25,
  blueStarveRate: 0.15,
  blueGrowSelfRate: 0.4,
  blueGrowOtherRate: 0.6,
  blueEatenSelfRate: 0.65,
  blueEatenOtherRate: 0.45,

  greenGrowRate: 0.75,
  greenDieRate: 0.0,
  greenGrowSelfRate: 0.5,
  greenGrowOtherRate: 0.9,
  greenEatenSelfRate: 0.95,
  greenEatenOtherRate: 0.65,
};

const cyanGooConfig: BlipConfig = {
  id: 'cyangoo',
  name: 'Cyan Goo',
  
  redInitial: 128,
  greenInitial: 128,
  blueInitial: 256,

  redGrowRate: 0.15,
  redEatRate: 0.2,
  redDieRate: 0.05,
  redStarveRate: 0.05,
  redGrowSelfRate: 0.05,
  redGrowOtherRate: 0.1,

  blueGrowRate: 0.5,
  blueEatRate: 0.4,
  blueDieRate: 0.05,
  blueStarveRate: 0.05,
  blueGrowSelfRate: 0.5,
  blueGrowOtherRate: 0.75,
  blueEatenSelfRate: 1.0,
  blueEatenOtherRate: 0.75,

  greenGrowRate: 0.75,
  greenDieRate: 0.01,
  greenGrowSelfRate: 0.35,
  greenGrowOtherRate: 0.9,
  greenEatenSelfRate: 1.05,
  greenEatenOtherRate: 0.7,
};

const darkCoral: BlipConfig = {
  id: 'darkCoral',
  name: 'Dark Coral',

  redInitial: 256,
  blueInitial: 256,
  greenInitial: 64,

  redGrowRate: 0.4,
  redEatRate: 0.45,
  redDieRate: 0.05,
  redStarveRate: 0.05,
  redGrowSelfRate: 0.5,
  redGrowOtherRate: 0.6,

  blueGrowRate: 0.8,
  blueEatRate: 0.9,
  blueDieRate: 0.2,
  blueStarveRate: 0.1,
  blueGrowSelfRate: 0.4,
  blueGrowOtherRate: 0.7,
  blueEatenSelfRate: 0.65,
  blueEatenOtherRate: 0.75,

  greenGrowRate: 0.47,
  greenDieRate: 0.05,
  greenGrowSelfRate: 0.35,
  greenGrowOtherRate: 0.7,
  greenEatenSelfRate: 0.95,
  greenEatenOtherRate: 0.65,
};

const mazeWaves: BlipConfig = {
  id: 'mazeWaves',
  name: 'Maze Waves',

  redInitial: 256,
  blueInitial: 256,
  greenInitial: 64,

  redGrowRate: 0.4,
  redEatRate: 0.6,
  redDieRate: 0.05,
  redStarveRate: 0.05,
  redGrowSelfRate: 0.5,
  redGrowOtherRate: 0.6,

  blueGrowRate: 0.8,
  blueEatRate: 0.99,
  blueDieRate: 0.25,
  blueStarveRate: 0.15,
  blueGrowSelfRate: 0.4,
  blueGrowOtherRate: 0.7,
  blueEatenSelfRate: 0.65,
  blueEatenOtherRate: 0.75,

  greenGrowRate: 0.45,
  greenDieRate: 0.05,
  greenGrowSelfRate: 0.35,
  greenGrowOtherRate: 0.7,
  greenEatenSelfRate: 0.95,
  greenEatenOtherRate: 0.65,
};

const raverCloud: BlipConfig = {
  id: 'raverCloud',
  name: 'Raver Cloud',

  redInitial: 256,
  blueInitial: 256,
  greenInitial: 256,

  redGrowRate: 0.15,
  redEatRate: 0.5,
  redDieRate: 0.1,
  redStarveRate: 0.05,
  redGrowSelfRate: 0.5,
  redGrowOtherRate: 0.5,

  blueGrowRate: 0.25,
  blueEatRate: 0.65,
  blueDieRate: 0.1,
  blueStarveRate: 0.5,
  blueGrowSelfRate: 0.5,
  blueGrowOtherRate: 0.5,
  blueEatenSelfRate: 0.5,
  blueEatenOtherRate: 0.5,

  greenGrowRate: 0.85,
  greenDieRate: 0.6,
  greenGrowSelfRate: 0.5,
  greenGrowOtherRate: 0.5,
  greenEatenSelfRate: 0.5,
  greenEatenOtherRate: 0.5,
};

export const blipConfigs = { 
  'default': defaultConfig, 
  'chlorophyll': chlorophyllConfig,
  'cyangoo': cyanGooConfig,
  'darkCoral': darkCoral,
  'mazeWaves': mazeWaves,
  'raverCloud': raverCloud,
} as const;