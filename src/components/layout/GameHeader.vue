<template>
  <n-space justify="space-between">
    <n-space v-if="showTitle" style="padding-left: 15px;" width="100%" class="header">
      <span>Abiogenesis</span>
    </n-space>
  </n-space>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';

  const showTitle = ref(window.innerWidth > 730);

  const updateTitle = () => {
    showTitle.value = window.innerWidth > 730;
  };

  const roomsBadge = ref(0);
  const profileBadge = ref(0);

  onMounted(() => {
    window.addEventListener('resize', updateTitle);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateTitle);
  });
</script>
  
<style scoped>
  .header {
    font-family: 'Doto', sans-serif;
    font-size: 40px;
    padding-right: 5px;
    padding-left: 5px;
  }

  .active-button,
  .active-button:hover,
  .active-button:active,
  .active-button:focus {
    background-color: #f0f0f0;
    color: #000000;
}
</style>
