<template>
  <n-slider v-model:value="value" :marks="customMarks" @update:value="updateSpeed" :max="80" :tooltip="false" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { emitter } from '../../utilities/emitter';

const value = ref(40);

const customMarks = {
  0: () => "0.25x",
  20: () => "0.5x",
  40: () => "1x",
  60: () => "1.5x",
  80: () => "2x",
}

const updateSpeed = () => {
  emitter.emit('updateSpeed', value.value);
};
</script>
