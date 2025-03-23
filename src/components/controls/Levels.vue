<template>
  <n-space vertical>
    <n-progress 
      type="line"
      status="success"
      :percentage="greenPercentage"
      indicator-placement="inside"
    >
    </n-progress>
    <n-progress 
      type="line"
      status="info"
      :percentage="bluePercentage"
      indicator-placement="inside"
    >
    </n-progress>
    <n-progress 
      type="line"
      status="error"
      :percentage="redPercentage"
      indicator-placement="inside"
    >
    </n-progress>
  </n-space>  
</template>

<script setup lang="ts">
import { emitter } from '../../utilities/emitter';
import { ref, onMounted, onBeforeUnmount } from 'vue';
const greenPercentage = ref(0);
const bluePercentage = ref(0);
const redPercentage = ref(0);

const updatePercentages = (averageRGB: { r: number; g: number; b: number }) => {
  redPercentage.value = Math.round(averageRGB.r);
  greenPercentage.value = Math.round(averageRGB.g);
  bluePercentage.value = Math.round(averageRGB.b);
};

onMounted(() => {
  emitter.on('updateAverageRGB', updatePercentages);
});

onBeforeUnmount(() => {
  emitter.off('updateAverageRGB', updatePercentages);
});
</script>
