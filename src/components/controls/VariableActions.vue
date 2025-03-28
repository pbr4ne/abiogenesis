<template>
  <!-- <n-button type="warning" @click="saveNewConfig">Save as New</n-button> -->
  <n-button type="warning" @click="randomizeConfig">Randomize</n-button>
  <n-button type="warning" @click="resetVariables">Reset to Default</n-button>
  <n-button type="warning" @click="closeDialog">Okay</n-button>
</template>

<script setup lang="ts">
import { emitter } from '../../utilities/emitter';
import { useStore } from '../../composables/useStore';
import { originalConfigs, randomize } from '../../utilities/blipConfigs';

function closeDialog() {
  emitter.emit('closeVariableDialog');
}

function resetVariables() {
  const store = useStore();
  const config = store.$state.currentConfig;
  const originalConfig = originalConfigs[config.id];
  Object.assign(config, originalConfig);
}

function randomizeConfig() {
  const store = useStore();
  const config = store.$state.currentConfig;
  randomize(config);
}

function saveNewConfig() {
  emitter.emit('closeVariableDialog');
}
</script>
