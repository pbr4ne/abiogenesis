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
  redInitial: 256,
  greenInitial: 256,
  blueInitial: 256,

  redGrowRate: 0.15,
  redEatRate: 0.5,
  redDieRate: 0.1,
  redStarveRate: 0.05,
  redGrowSelfRate: 0.5,
  redGrowOtherRate: 0.5,

  blueGrowRate: 0.5,
  blueEatRate: 1.0,
  blueDieRate: 0.1,
  blueStarveRate: 0.5,
  blueGrowSelfRate: 0.5,
  blueGrowOtherRate: 0.5,
  blueEatenSelfRate: 0.5,
  blueEatenOtherRate: 0.5,

  greenGrowRate: 0.85,
  greenDieRate: 0.1,
  greenGrowSelfRate: 0.5,
  greenGrowOtherRate: 0.5,
  greenEatenSelfRate: 0.5,
  greenEatenOtherRate: 0.5,
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
