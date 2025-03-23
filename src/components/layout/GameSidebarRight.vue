<template>
  <n-space vertical style="padding: 20px; position: relative;">
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
