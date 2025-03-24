<template>
  <n-space vertical style="padding: 20px; position: relative;">
    <presets v-if="!collapsed"/>   
    <n-divider />
  </n-space>
</template>

<script setup lang="ts">
import Presets from '../controls/Presets.vue';

const { collapsed } = defineProps({
  collapsed: {
    type: Boolean,
    required: true,
  },
});
</script>

<style scoped>
  .n-space {
    position: relative;
  }
</style>
