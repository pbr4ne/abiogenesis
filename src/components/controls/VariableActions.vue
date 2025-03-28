<template>
  <n-button type="warning">Save as New</n-button>
  <n-button type="warning">Reset</n-button>
  <n-button type="warning" @click="closeDialog">Okay</n-button>
</template>

<script setup lang="ts">
import { emitter } from '../../utilities/emitter';

function closeDialog() {
  emitter.emit('closeVariableDialog');
}
</script>