<template>
  <div class="grid-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const gridWidth = ref(0);
const gridHeight = ref(0);
const cellSize = 5;
let grid: string[] = [];

const resizeGrid = () => {
  if (!canvasRef.value) return;
  const parent = canvasRef.value.parentElement;
  if (!parent) return;

  gridWidth.value = Math.floor(parent.clientWidth / cellSize);
  gridHeight.value = Math.floor(parent.clientHeight / cellSize);

  grid = new Array(gridWidth.value * gridHeight.value).fill("#000000");

  canvasRef.value.width = gridWidth.value * cellSize;
  canvasRef.value.height = gridHeight.value * cellSize;

  drawGrid();
};

const drawGrid = () => {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext("2d");
  if (!ctx) return;

  for (let y = 0; y < gridHeight.value; y++) {
    for (let x = 0; x < gridWidth.value; x++) {
      const color = grid[y * gridWidth.value + x];
      ctx.fillStyle = color;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
};

const updateGrid = () => {
  const index = Math.floor(Math.random() * grid.length);
  grid[index] = `hsl(${Math.random() * 360}, 100%, 50%)`;
  drawGrid();
};

const handleResize = () => {
  resizeGrid();
};

onMounted(() => {
  resizeGrid();
  window.addEventListener("resize", handleResize);
  setInterval(updateGrid, 100);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
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
