<template>
  <div class="grid-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useBlips } from '../composables/useBlips';
import { emitter } from '../utilities/emitter';
import { defaultConfig } from '../configs/default';

const { cellSize, init, process, draw, calculateAverageRGB } = useBlips(defaultConfig);

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

  emitter.emit('updateAverageRGB', calculateAverageRGB());
}

function updateGrid() {
  process();

  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    draw(ctx);
  }

  emitter.emit('updateAverageRGB', calculateAverageRGB());
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
