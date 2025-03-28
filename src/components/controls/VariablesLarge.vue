<template>
  <n-form label-placement="left" :show-feedback="false">
    <n-grid :cols="4" :x-gap="5" :y-gap="0">

      <n-form-item-gi>
        <n-text>Initial Amount</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.greenInitial" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.blueInitial" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.redInitial" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Growth Rate</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.greenGrowRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.blueGrowRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.redGrowRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Eats Rate</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.blueEatRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.redEatRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Starve Rate</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.blueStarveRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.redStarveRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Death Rate</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.greenDieRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.blueDieRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.redDieRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Self-Growth Wt</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.greenGrowSelfRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.blueGrowSelfRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.redGrowSelfRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Other-Growth Wt</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.greenGrowOtherRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.blueGrowOtherRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.redGrowOtherRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Self-Eaten Wt</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.greenEatenSelfRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.blueEatenSelfRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Others-Eaten Wt</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.greenEatenOtherRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input v-model:value="config.blueEatenOtherRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
      </n-form-item-gi>

    </n-grid>
  </n-form>
</template>
<script setup lang="ts">
import { useStore } from '../../composables/useStore';
import VariableInput from '../ui/VariableInput.vue';

const store = useStore();
const config = store.$state.currentConfig;
</script>