<template>
  <n-select v-model:value="value" :options="options" @update:value="handleUpdateValue" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { blipConfigs } from '../../utilities/blipConfigs';
import { emitter } from '../../utilities/emitter';
const value = ref("default");

const options = Object.values(blipConfigs).map((config) => {
  return {
    label: config.name,
    value: config.id,
  };
});

const handleUpdateValue = (value: string) => {
  emitter.emit('changeBlipConfig', value);
  emitter.emit('reset');
}
</script>
