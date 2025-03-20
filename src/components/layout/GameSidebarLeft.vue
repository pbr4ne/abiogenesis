<template>
  <n-space vertical size="medium" style="padding: 20px;">
    <n-slider v-model:value="value" :marks="customMarks" @update:value="updateSpeed" />
  </n-space>
</template>

<script setup lang="ts">
import { computed, h, ref, onMounted, onBeforeUnmount } from 'vue';
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
  emitter.emit('updateSpeed', 100 - value.value);
};

const { collapsed } = defineProps({
  collapsed: {
    type: Boolean,
    required: true,
  },
});

const screenHeight = ref(window.innerHeight);

const dividerStyle = computed(() => {
  return screenHeight.value < 780 ? { margin: '0' } : {};
});

const updateScreenHeight = () => {
  screenHeight.value = window.innerHeight;
};

onMounted(() => {
  window.addEventListener('resize', updateScreenHeight);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScreenHeight);
});
</script>
