<template>
  <n-space vertical style="padding: 20px; position: relative;">
    <presets v-if="!collapsed"/>   
    <n-divider />
    <n-space justify="center">  
      <n-button size="large" secondary round type="warning" @click="showVariables">
        <template #icon>
          <n-icon><braces-variable24-filled /></n-icon>
        </template>
        Change Variables
      </n-button>
    </n-space>
  </n-space>
</template>

<script setup lang="ts">
import { h } from 'vue';
import { useDialog } from 'naive-ui'
import Presets from '../controls/Presets.vue';
import VariableActions from '../controls/VariableActions.vue';
import VariablesLarge from '../controls/VariablesLarge.vue';
import { BracesVariable24Filled } from '@vicons/fluent';
import { emitter } from '../../utilities/emitter';

const dialog = useDialog();

const showVariables = function() {
  const variableDialog = dialog.warning({
    title: 'Variables',
    content: () => h(VariablesLarge),
    action: () => h(VariableActions),
    icon: () => h(BracesVariable24Filled),
    style: 'width: 550px;'
  });

  const closeHandler = () => {
    variableDialog.destroy();
    emitter.off('closeVariableDialog', closeHandler);
  };
  emitter.on('closeVariableDialog', closeHandler);
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
