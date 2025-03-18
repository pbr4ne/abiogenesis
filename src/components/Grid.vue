<template>
  <div class="grid-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
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

interface Blip {
  r: number;
  g: number;
  b: number;
}

const canvasRef = ref<HTMLCanvasElement|null>(null);
const gridWidth = ref(0);
const gridHeight = ref(0);
const cellSize = 5;

let blips: Blip[][] = [];

function resizeGrid() {
  if (!canvasRef.value) return;
  const parent = canvasRef.value.parentElement;
  if (!parent) return;

  gridWidth.value = Math.floor(parent.clientWidth / cellSize);
  gridHeight.value = Math.floor(parent.clientHeight / cellSize);

  initBlips(gridWidth.value, gridHeight.value);

  canvasRef.value.width = gridWidth.value * cellSize;
  canvasRef.value.height = gridHeight.value * cellSize;

  drawGrid();
}

function initBlips(width: number, height: number) {
  blips = [];
  for (let y = 0; y < height; y++) {
    const row: Blip[] = [];
    for (let x = 0; x < width; x++) {
      // Example random init
      row.push({
        r: Math.floor(Math.random() * 50),
        g: Math.floor(Math.random() * 50),
        b: Math.floor(Math.random() * 50),
      });
    }
    blips.push(row);
  }
}

function drawGrid() {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  for (let y = 0; y < blips.length; y++) {
    for (let x = 0; x < blips[y].length; x++) {
      const { r, g, b } = blips[y][x];
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

function processBlips() {
  const temp: Blip[][] = blips.map(row => row.map(cell => ({ ...cell })));

  const height = blips.length;
  if (height === 0) return;
  const width = blips[0].length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const self = temp[y][x];

      let totalRed = 0, totalGreen = 0, totalBlue = 0;
      let neighborCount = 0;

      for (let ny = y - 1; ny <= y + 1; ny++) {
        for (let nx = x - 1; nx <= x + 1; nx++) {
          if (nx === x && ny === y) {
            continue;
          }
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            totalRed   += temp[ny][nx].r;
            totalGreen += temp[ny][nx].g;
            totalBlue  += temp[ny][nx].b;
            neighborCount++;
          }
        }
      }

      let avgRed = neighborCount > 0 ? totalRed / neighborCount : 0;
      let avgGreen = neighborCount > 0 ? totalGreen / neighborCount : 0;
      let avgBlue = neighborCount > 0 ? totalBlue / neighborCount : 0;

      const growRedSelf = self.b * config.GROW_R * config.GROW_SELF_R;
      const growRedOther = avgBlue * config.GROW_R * config.GROW_OTHER_R;
      const starveRedSelf = starveValue(self.r, (totalBlue + self.b) / (neighborCount + 1)) * config.STARVE_R;
      const removeRed = self.r * config.DIE_R + starveRedSelf;
      const addRed = growRedSelf + growRedOther;
      const newR = roundColor(self.r + addRed - removeRed);

      const growBlueSelf  = self.g * config.GROW_B * config.GROW_SELF_B;
      const growBlueOther = avgGreen * config.GROW_B * config.GROW_OTHER_B;
      const eatenBlueSelf = self.r * config.EAT_R * config.EATEN_SELF_B;
      const eatenBlueOther = avgRed * config.EAT_R * config.EATEN_OTHER_B;
      const starveBlueSelf = starveValue(self.b, (totalGreen + self.g) / (neighborCount + 1)) * config.STARVE_B;
      const removeBlue = self.b * config.DIE_B + eatenBlueSelf + eatenBlueOther + starveBlueSelf;
      const addBlue = growBlueSelf + growBlueOther;
      const newB = roundColor(self.b + addBlue - removeBlue);

      const growGreenSelf  = self.g * config.GROW_G * config.GROW_SELF_G;
      const growGreenOther = avgGreen * config.GROW_G * config.GROW_OTHER_G;
      const eatenGreenSelf = self.b * config.EAT_B * config.EATEN_SELF_G;
      const eatenGreenOther = avgBlue * config.EAT_B * config.EATEN_OTHER_G;
      const removeGreen = self.g * config.DIE_G + eatenGreenSelf + eatenGreenOther;
      const addGreen = growGreenSelf + growGreenOther;
      const newG = roundColor(self.g + addGreen - removeGreen);

      blips[y][x] = { r: newR, g: newG, b: newB };
    }
  }
}

function starveValue(eater: number, eaten: number) {
  return eater > eaten ? eater - eaten : 0;
}

function roundColor(c: number) {
  if (c < 0) return 0;
  if (c > 255) return 255;
  return Math.round(c);
}

function drawBlips(ctx: CanvasRenderingContext2D) {
  const height = blips.length;
  if (height === 0) return;
  const width = blips[0].length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const { r, g, b } = blips[y][x];
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(
        x * cellSize,
        y * cellSize,
        cellSize,
        cellSize
      );
    }
  }
}

function updateGrid() {
  processBlips();
  drawGrid();
}

function handleResize() {
  resizeGrid();
}

onMounted(() => {
  resizeGrid();
  window.addEventListener('resize', handleResize);
  emitter.on('updateGrid', updateGrid);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  emitter.off('updateGrid', updateGrid);
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
