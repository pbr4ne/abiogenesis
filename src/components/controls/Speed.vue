<template>
  <n-slider v-model:value="value" :marks="customMarks" @update:value="updateSpeed" />
</template>

<script setup lang="ts">
import { h, ref } from 'vue';
import { PauseCircleOutline, PlayCircleOutline, PlayForwardCircleOutline } from '@vicons/ionicons5';
import { NFlex, NIcon } from 'naive-ui';
import { emitter } from '../../utilities/emitter';

const value = ref(50);

const customMarks = {
  0: () => renderMark(PauseCircleOutline),
  50: () => renderMark(PlayCircleOutline),
  100: () => renderMark(PlayForwardCircleOutline),
}

const renderMark = (component: object) => {
  return h(
    NFlex,
    { style: {  } },
    {
      default: () => [
        h(NIcon, { size: 24, component }),
      ]
    }
  )
}

const updateSpeed = () => {
  emitter.emit('updateSpeed', value.value);
};
</script>
