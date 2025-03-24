<template>
  <n-space justify="center">   
    <n-tooltip placement="top" trigger="hover">
      <template #trigger>
        <n-button size="large" secondary round type="success" @click="emitter.emit('play')" v-if="paused">
          <template #icon>
            <n-icon><play-outline /></n-icon>
          </template>
        </n-button>
        <n-button size="large" secondary round type="error" @click="emitter.emit('pause')" v-else>
          <template #icon>
            <n-icon><pause-outline /></n-icon>
          </template>
        </n-button>
      </template>
      <span v-if="paused">Play</span>
      <span v-else>Pause</span>
    </n-tooltip>
    <n-tooltip placement="top" trigger="hover">
      <template #trigger>
        <n-button size="large" secondary round type="info" @click="emitter.emit('reset')">
          <template #icon>
            <n-icon><refresh-dot /></n-icon>
          </template>
        </n-button>
      </template>
      <span>Restart</span>
    </n-tooltip>
  </n-space>  
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { PlayOutline, PauseOutline } from '@vicons/ionicons5';
import { RefreshDot } from '@vicons/tabler';
import { emitter } from '../../utilities/emitter';

const play = function() {
  paused.value = false;
};

const reset = function() {
  emitter.emit('pause');
};

const pause = function() {
  paused.value = true;
};

const paused = ref(true);

onMounted(() => {

  emitter.on('pause', pause);
  emitter.on('play', play);
  emitter.on('reset', reset);
});

onBeforeUnmount(() => {
  emitter.off('pause', pause);
  emitter.off('play', play);
  emitter.off('reset', reset);
});
</script>
