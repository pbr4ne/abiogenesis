<template>
  <n-space vertical size="medium" style="padding: 20px;">
  </n-space>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';

const { collapsed } = defineProps({
  collapsed: {
    type: Boolean,
    required: true,
  },
});

const screenHeight = ref(window.innerHeight);

const dividerStyle = computed(() => {
  return screenHeight.value < 780 ? { margin: '0' } : {};
});

const updateScreenHeight = () => {
  screenHeight.value = window.innerHeight;
};

onMounted(() => {
  window.addEventListener('resize', updateScreenHeight);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScreenHeight);
});
</script>