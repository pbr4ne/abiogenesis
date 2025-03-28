<template>
  <div class="grid-container">
    <canvas ref="canvasRef"></canvas>

    <n-button size="large" round type="success" @click="handlePlayClick" v-if="showPlayButton" class="play-overlay">
      <template #icon>
        <n-icon><play-outline /></n-icon>
      </template>
    </n-button>
    
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useBlips } from '../composables/useBlips';
import { emitter } from '../utilities/emitter';
import { PlayOutline } from '@vicons/ionicons5';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const showPlayButton = ref(true);
let blipsInstance = useBlips();
const gridWidth = ref(0);
const gridHeight = ref(0);

function handlePlayClick() {
  emitter.emit('play');
}

function handleResize() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  gridWidth.value = Math.floor(width / blipsInstance.cellSize);
  gridHeight.value = Math.floor(height / blipsInstance.cellSize);

  blipsInstance.init(gridWidth.value, gridHeight.value);

  canvas.width = gridWidth.value * blipsInstance.cellSize;
  canvas.height = gridHeight.value * blipsInstance.cellSize;

  showPlayButton.value = true;

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

function changeBlipConfig() {
  blipsInstance = useBlips();

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

const play = function() {
  showPlayButton.value = false;
};

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);

  emitter.on('play', play);
  emitter.on('updateGrid', updateGrid);
  emitter.on('reset', () => handleResize());
  emitter.on('changeBlipConfig', () => changeBlipConfig());
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);

  emitter.off('play', play);
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
  position: relative;
}
canvas {
  display: block;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 1px solid black;
}
</style>
