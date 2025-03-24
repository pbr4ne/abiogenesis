<template>
  <n-space vertical>
    <n-tooltip placement="top" trigger="hover">
      <template #trigger>
        <n-progress 
          type="line"
          status="success"
          :percentage="greenPercentage"
          indicator-placement="inside"
        >
        </n-progress>
      </template>
      <span>Plants</span>
    </n-tooltip>
    <n-tooltip placement="top" trigger="hover">
      <template #trigger>
        <n-progress 
          type="line"
          status="info"
          :percentage="bluePercentage"
          indicator-placement="inside"
        ></n-progress>
      </template>
      <span>Herbivores</span>
    </n-tooltip>
    <n-tooltip placement="top" trigger="hover">
      <template #trigger>
        <n-progress 
          type="line"
          status="error"
          :percentage="redPercentage"
          indicator-placement="inside"
        >
        </n-progress>
      </template>
      <span>Carnivores</span>
    </n-tooltip>
  </n-space>  
</template>

<script setup lang="ts">
import { emitter } from '../../utilities/emitter';
import { ref, onMounted, onBeforeUnmount } from 'vue';
const greenPercentage = ref(0);
const bluePercentage = ref(0);
const redPercentage = ref(0);

const updatePercentages = (averageRGB: { r: number; g: number; b: number }) => {
  redPercentage.value = Math.round(averageRGB.r/256 * 100);
  greenPercentage.value = Math.round(averageRGB.g/256 * 100);
  bluePercentage.value = Math.round(averageRGB.b/256 * 100);
};

onMounted(() => {
  emitter.on('updateAverageRGB', updatePercentages);
});

onBeforeUnmount(() => {
  emitter.off('updateAverageRGB', updatePercentages);
});
</script>
