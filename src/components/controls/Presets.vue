<template>
  <n-h3>Presets</n-h3>
  <n-select v-model:value="value" :options="options" @update:value="handleUpdateValue" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { blipConfigs } from '../../utilities/blipConfigs';
import { emitter } from '../../utilities/emitter';
import { useStore } from '../../composables/useStore';
const value = ref("default");

const options = Object.values(blipConfigs).map((config) => {
  return {
    label: config.name,
    value: config.id,
  };
});

const handleUpdateValue = (value: string) => {

  const store = useStore();
  store.$state.currentConfig = blipConfigs[value];
  emitter.emit('changeBlipConfig');
  emitter.emit('reset');
}
</script>
