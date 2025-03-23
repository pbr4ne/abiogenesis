<template>
  <n-space justify="center">   
    <n-tooltip placement="top" trigger="hover">
      <template #trigger>
        <n-button size="large" secondary round type="success" @click="play" v-if="paused">
          <template #icon>
            <n-icon><play-outline /></n-icon>
          </template>
        </n-button>
        <n-button size="large" secondary round type="error" @click="pause" v-else>
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
        <n-button size="large" secondary round type="info" @click="restart">
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
import { ref } from 'vue';
import { PlayOutline, PauseOutline } from '@vicons/ionicons5';
import { RefreshDot } from '@vicons/tabler';
import { emitter } from '../../utilities/emitter';

const play = function() {
  paused.value = false;
  emitter.emit('play');
};

const restart = function() {
  paused.value = true;
  emitter.emit('pause');
  emitter.emit('reset');
};

const pause = function() {
  paused.value = true;
  emitter.emit('pause');
};

const paused = ref(true);

</script>
