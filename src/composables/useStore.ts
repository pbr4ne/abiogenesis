import { defineStore } from 'pinia';
import { emitter } from '../utilities/emitter';
import { GameState } from '../utilities/types';
import { blipConfigs } from '../utilities/blipConfigs';

const initialState = (): GameState => ({
    currentConfig: blipConfigs.default,
    configs: blipConfigs,
});

export const useStore = defineStore('gameState', {
    state: (): GameState => initialState(),
  
    actions: {
    },
});
