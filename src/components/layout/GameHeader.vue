<template>
  <n-space justify="space-between">
    <n-space style="padding-left: 15px;" width="100%" class="header">
      <n-gradient-text :gradient="{
        deg: 90,
        from: '#f0900b',
        to: '#f2c97d',
      }">
      Abiogenesis
      </n-gradient-text>
    </n-space>
  </n-space>
</template>

<script setup lang="ts">
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
