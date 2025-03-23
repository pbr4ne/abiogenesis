<template>
  <n-space vertical size="medium" style="padding: 20px;">
    <reset v-if="!collapsed"/>   
    <n-divider />
    <speed v-if="!collapsed"/>
    <n-divider />
    <levels v-if="!collapsed"/>
  </n-space>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import Levels from '../controls/Levels.vue';
import Reset from '../controls/Reset.vue';
import Speed from '../controls/Speed.vue';

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
