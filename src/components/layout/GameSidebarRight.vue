<template>
  <n-space vertical style="padding: 20px; position: relative;">
    <presets v-if="!collapsed"/>   
    <n-divider />
    <n-space justify="center">  
      <n-button size="large" secondary round type="warning" @click="showVariables">
        <template #icon>
          <n-icon><braces-variable24-filled /></n-icon>
        </template>
        Variables
      </n-button>
    </n-space>
  </n-space>
</template>

<script setup lang="ts">
import { h } from 'vue';
import { useDialog } from 'naive-ui'
import Presets from '../controls/Presets.vue';
import VariablesLarge from '../controls/VariablesLarge.vue';
import { BracesVariable24Filled } from '@vicons/fluent';

const dialog = useDialog();

const showVariables = function() {
  dialog.info({
    title: 'Variables',
    content: () => h(VariablesLarge),
    positiveText: 'Close',
    icon: () => h(BracesVariable24Filled),
    style: 'width: 550px;'
  });
};

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
