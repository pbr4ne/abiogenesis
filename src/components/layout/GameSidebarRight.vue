<template>
  <n-space vertical style="padding: 20px; position: relative;" @mouseenter="showTrash = true" @mouseleave="showTrash = false">
  </n-space>
</template>

<script setup lang="ts">
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
