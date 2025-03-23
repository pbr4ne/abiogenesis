<template>
  <n-slider v-model:value="value" :marks="customMarks" @update:value="updateSpeed" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { emitter } from '../../utilities/emitter';

const value = ref(33);

const customMarks = {
  0: () => "0.5x",
  33: () => "1x",
  66: () => "1.5x",
  100: () => "2x",
}

const updateSpeed = () => {
  emitter.emit('updateSpeed', value.value);
};
</script>
