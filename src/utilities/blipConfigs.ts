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

const chlorophyll: BlipConfig = {
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

const cyanGoo: BlipConfig = {
  id: 'cyanGoo',
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

const evilOrbs: BlipConfig = {
  id: 'evilOrbs',
  name: 'Evil Orbs',

  redInitial: 128,
  blueInitial: 256,
  greenInitial: 38,

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
  blueEatenSelfRate: 1.0,
  blueEatenOtherRate: 0.75,

  greenGrowRate: 0.47,
  greenDieRate: 0.05,
  greenGrowSelfRate: 0.35,
  greenGrowOtherRate: 0.7,
  greenEatenSelfRate: 1.05,
  greenEatenOtherRate: 0.65,
};

const islandWaves: BlipConfig = {
  id: 'islandWaves',
  name: 'Island Waves',

  redInitial: 128,
  blueInitial: 256,
  greenInitial: 256,

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

const brainMaze: BlipConfig = {
  id: 'brainMaze',
  name: 'Brain Maze',

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

const formationOfTheUniverse: BlipConfig = {
  id: 'formation',
  name: 'Formation of the Universe',

  redInitial: 256,
  blueInitial: 256,
  greenInitial: 128,

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

const neonCoral: BlipConfig = {
  id: 'neonCoral',
  name: 'Neon Coral',

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

const wildfire: BlipConfig = {
  id: 'wildfire',
  name: 'Wildfire',

  redInitial: 256,
  blueInitial: 256,
  greenInitial: 64,

  redGrowRate: 0.4,
  redEatRate: 0.65,
  redDieRate: 0.05,
  redStarveRate: 0.05,
  redGrowSelfRate: 0.5,
  redGrowOtherRate: 0.6,

  blueGrowRate: 0.8,
  blueEatRate: 0.97,
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

const lavaLamp: BlipConfig = {
  id: 'lavaLamp',
  name: 'Lava Lamp',

  redInitial: 76,
  blueInitial: 64,
  greenInitial: 256,

  redGrowRate: 0.15,
  redEatRate: 0.5,
  redDieRate: 0.05,
  redStarveRate: 0.05,
  redGrowSelfRate: 0.35,
  redGrowOtherRate: 0.1,

  blueGrowRate: 0.25,
  blueEatRate: 0.6,
  blueDieRate: 0.15,
  blueStarveRate: 0.5,
  blueGrowSelfRate: 0.5,
  blueGrowOtherRate: 0.75,
  blueEatenSelfRate: 0.5,
  blueEatenOtherRate: 1.3,

  greenGrowRate: 0.85,
  greenDieRate: 0.5,
  greenGrowSelfRate: 0.35,
  greenGrowOtherRate: 0.9,
  greenEatenSelfRate: 0.8,
  greenEatenOtherRate: 1.3,
};

const ledLights: BlipConfig = {
  id: 'ledLights',
  name: 'LED Lights',

  redInitial: 256,
  greenInitial: 256,
  blueInitial: 256,

  redGrowRate: 0.3,
  redEatRate: 0.6,
  redDieRate: 0.25,
  redStarveRate: 0.05,
  redGrowSelfRate: 0.5,
  redGrowOtherRate: 0.5,

  blueGrowRate: 0.5,
  blueEatRate: 1.05,
  blueDieRate: 0.1,
  blueStarveRate: 0.5,
  blueGrowSelfRate: 0.5,
  blueGrowOtherRate: 0.55,
  blueEatenSelfRate: 0.5,
  blueEatenOtherRate: 0.7,

  greenGrowRate: 0.6,
  greenDieRate: 0.05,
  greenGrowSelfRate: 0.5,
  greenGrowOtherRate: 0.5,
  greenEatenSelfRate: 0.5,
  greenEatenOtherRate: 0.6,
};

export const blipConfigs = { 
  'default': defaultConfig, 
  'brainMaze': brainMaze,
  'chlorophyll': chlorophyll,
  'cyanGoo': cyanGoo,
  //'evilOrbs': evilOrbs,
  'formation': formationOfTheUniverse,
  'islandWaves': islandWaves,
  'ledLights': ledLights,
  //'lavaLamp': lavaLamp,
  'neonCoral': neonCoral,
  'raverCloud': raverCloud,
  //'wildfire': wildfire,
} as const;

//deep copy
export const originalConfigs = JSON.parse(JSON.stringify(blipConfigs)) as Record<string, BlipConfig>;

const RANGES: Record<string, { min: number; max: number }> = {
  redInitial:   { min: 50,  max: 300 },
  greenInitial: { min: 50,  max: 300 },
  blueInitial:  { min: 50,  max: 300 },

  redGrowRate:         { min: 0,   max: 1 },
  redEatRate:          { min: 0,   max: 1.5 },
  redDieRate:          { min: 0,   max: 0.6 },
  redStarveRate:       { min: 0,   max: 0.6 },
  redGrowSelfRate:     { min: 0,   max: 1 },
  redGrowOtherRate:    { min: 0,   max: 1 },
  
  blueGrowRate:        { min: 0,   max: 1 },
  blueEatRate:         { min: 0,   max: 1.5 },
  blueDieRate:         { min: 0,   max: 0.6 },
  blueStarveRate:      { min: 0,   max: 0.6 },
  blueGrowSelfRate:    { min: 0,   max: 1 },
  blueGrowOtherRate:   { min: 0,   max: 1 },
  blueEatenSelfRate:   { min: 0,   max: 1.3 },
  blueEatenOtherRate:  { min: 0,   max: 1.3 },

  greenGrowRate:       { min: 0,   max: 1 },
  greenDieRate:        { min: 0,   max: 0.6 },
  greenGrowSelfRate:   { min: 0,   max: 1 },
  greenGrowOtherRate:  { min: 0,   max: 1 },
  greenEatenSelfRate:  { min: 0,   max: 1.3 },
  greenEatenOtherRate: { min: 0,   max: 1.3 },
};

export function randomize(config: BlipConfig) {
  (Object.keys(RANGES) as Array<keyof BlipConfig>).forEach(key => {
    config[key] = randomInRange(RANGES[key].min, RANGES[key].max) as any;
  });
}

function randomInRange(min: number, max: number) {
  const raw = Math.random() * (max - min) + min;
  const stepped = Math.round(raw * 20) / 20;
  return parseFloat(stepped.toFixed(2));
}
