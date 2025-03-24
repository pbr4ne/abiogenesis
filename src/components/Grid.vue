<template>
  <div class="grid-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useBlips } from '../composables/useBlips';
import { emitter } from '../utilities/emitter';

const config = {
  INITIAL_R: 256,
  INITIAL_G: 256,
  INITIAL_B: 256,

  GROW_R: 0.15,
  EAT_R: 0.5,
  DIE_R: 0.1,
  STARVE_R: 0.05,
  GROW_SELF_R: 0.5,
  GROW_OTHER_R: 0.5,

  GROW_B: 0.5,
  EAT_B: 1.0,
  DIE_B: 0.1,
  STARVE_B: 0.5,
  GROW_SELF_B: 0.5,
  GROW_OTHER_B: 0.5,
  EATEN_SELF_B: 0.5,
  EATEN_OTHER_B: 0.5,

  GROW_G: 0.85,
  DIE_G: 0.1,
  GROW_SELF_G: 0.5,
  GROW_OTHER_G: 0.5,
  EATEN_SELF_G: 0.5,
  EATEN_OTHER_G: 0.5,
};

const { cellSize, init, process, draw, calculateAverageRGB } = useBlips(config);

const canvasRef = ref<HTMLCanvasElement | null>(null);

function handleResize() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const parent = canvas.parentElement;
  if (!parent) return;

  const width = Math.floor(parent.clientWidth / cellSize);
  const height = Math.floor(parent.clientHeight / cellSize);

  init(width, height);

  canvas.width = width * cellSize;
  canvas.height = height * cellSize;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    draw(ctx);
  }
}

function updateGrid() {
  process();

  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    draw(ctx);
  }

  const avg = calculateAverageRGB();
  emitter.emit('updateAverageRGB', avg);
}

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);

  emitter.on('updateGrid', updateGrid);

  emitter.on('reset', () => {
    handleResize();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);

  emitter.off('updateGrid', updateGrid);
  emitter.off('reset');
});
</script>

<style scoped>
.grid-container {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
}
canvas {
  display: block;
}
</style>
