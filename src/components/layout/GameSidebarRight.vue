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
      <n-button size="large" secondary round type="error" @click="randomizeVariables">
        <template #icon>
          <n-icon><dice-outline /></n-icon>
        </template>
        Randomize Variables
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
import { DiceOutline } from '@vicons/ionicons5';
import { emitter } from '../../utilities/emitter';
import { useStore } from '../../composables/useStore';
import { randomize } from '../../utilities/blipConfigs';

const dialog = useDialog();

const randomizeVariables = () => {
  const store = useStore();
  const config = store.$state.currentConfig;
  randomize(config);
  emitter.emit('reset');
}

const showVariables = () => {
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
