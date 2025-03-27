<template>
  <n-form label-placement="left" :show-feedback="false">
    <n-grid :cols="4" :x-gap="5" :y-gap="0">

      <n-form-item-gi>
        <n-text>Initial Amount</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.greenInitial" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.blueInitial" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.redInitial" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Growth Rate</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.greenGrowRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.blueGrowRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.redGrowRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Eats Rate</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.blueEatRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.redEatRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Starve Rate</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.blueStarveRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.redStarveRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Death Rate</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.greenDieRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.blueDieRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.redDieRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Self-Growth Wt</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.greenGrowSelfRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.blueGrowSelfRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.redGrowSelfRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Other-Growth Wt</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.greenGrowOtherRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.blueGrowOtherRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.redGrowOtherRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Self-Eaten Wt</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.greenEatenSelfRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.blueEatenSelfRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
      </n-form-item-gi>

      <n-form-item-gi>
        <n-text>Others-Eaten Wt</n-text>
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.greenEatenOtherRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi>
        <variable-input :value="config.blueEatenOtherRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
      </n-form-item-gi>

    </n-grid>
  </n-form>
</template>
<script setup lang="ts">
import { blipConfigs } from '../../utilities/blipConfigs';
import VariableInput from '../ui/VariableInput.vue';

const config = blipConfigs.default;
</script>