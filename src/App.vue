<template>
  <n-config-provider :theme="theme">
    <n-dialog-provider>
      <div id="app">
        <div class="fullscreen-grid">
          <Grid />
        </div>
        <game />
      </div>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import Game from './components/layout/Game.vue';
import Grid from './components/Grid.vue';
import useTheme from './composables/useTheme';
import { darkTheme } from 'naive-ui';

const { lightMode } = useTheme();
const theme = computed(() => {
  return lightMode.value ? null : darkTheme;
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Doto:wght@100..900&display=swap');

#app {
  width: 100%;
  height: 100svh;
  position: relative;
  overflow: hidden;
}

.fullscreen-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>
