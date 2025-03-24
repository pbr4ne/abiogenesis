<template>
  <div class="grid-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useBlips } from '../composables/useBlips';
import { emitter } from '../utilities/emitter';
import { blipConfigs } from '../utilities/blipConfigs';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const currentConfigId = ref('default');
let blipsInstance = useBlips(blipConfigs.default);
const gridWidth = ref(0);
const gridHeight = ref(0);

function handleResize() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const parent = canvas.parentElement;
  if (!parent) return;

  gridWidth.value = Math.floor(parent.clientWidth / blipsInstance.cellSize);
  gridHeight.value = Math.floor(parent.clientHeight / blipsInstance.cellSize);

  blipsInstance.init(gridWidth.value, gridHeight.value);

  canvas.width = gridWidth.value * blipsInstance.cellSize;
  canvas.height = gridHeight.value * blipsInstance.cellSize;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    blipsInstance.draw(ctx);
  }

  emitter.emit('updateAverageRGB', blipsInstance.calculateAverageRGB());
}

function updateGrid() {
  blipsInstance.process();

  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    blipsInstance.draw(ctx);
  }

  emitter.emit('updateAverageRGB', blipsInstance.calculateAverageRGB());
}

function changeBlipConfig(newId: string) {
  if (blipConfigs[newId]) {
    currentConfigId.value = newId;
    blipsInstance = useBlips(blipConfigs[newId]);

    blipsInstance.init(gridWidth.value, gridHeight.value);

    const canvas = canvasRef.value;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        blipsInstance.draw(ctx);
      }
    }

    emitter.emit('pause');
    emitter.emit('updateAverageRGB', blipsInstance.calculateAverageRGB());
  }
}

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);

  emitter.on('updateGrid', updateGrid);
  emitter.on('reset', () => handleResize());
  emitter.on('changeBlipConfig', (newId: string) => changeBlipConfig(newId));
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
