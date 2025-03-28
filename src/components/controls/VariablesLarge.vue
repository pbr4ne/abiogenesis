<template>
  <n-form label-placement="left" :show-feedback="false">
    <n-grid :cols="4" :x-gap="5" :y-gap="0">

      <n-form-item-gi>
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <n-icon size="24" style="padding-right: 5px;" color="#63e2b7"><SunnyOutline /></n-icon>
        <n-text>Plant</n-text>
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <n-icon size="24" style="padding-right: 5px;" color="#70c0e8"><LeafOutline /></n-icon>
        <n-text>Herbivore</n-text>
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <n-icon size="24" style="padding-right: 5px;" color="#e88080"><Meat /></n-icon>
        <n-text>Carnivore</n-text>
      </n-form-item-gi>

      <n-form-item-gi class="rightAligned">
        <n-text>Initial Amount:</n-text>
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.greenInitial" type="green" :step="1" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.blueInitial" type="blue" :step="1" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.redInitial" type="red" :step="1" />
      </n-form-item-gi>

      <n-form-item-gi class="rightAligned">
        <n-text>Growth Rate:</n-text>
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.greenGrowRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.blueGrowRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.redGrowRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi class="rightAligned">
        <n-text>Eats Rate:</n-text>
      </n-form-item-gi>
      <n-form-item-gi class="centered">
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.blueEatRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.redEatRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi class="rightAligned">
        <n-text>Starve Rate:</n-text>
      </n-form-item-gi>
      <n-form-item-gi class="centered">
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.blueStarveRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.redStarveRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi class="rightAligned">
        <n-text>Death Rate:</n-text>
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.greenDieRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.blueDieRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.redDieRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi class="rightAligned">
        <n-text>Self-Growth Wt:</n-text>
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.greenGrowSelfRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.blueGrowSelfRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.redGrowSelfRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi class="rightAligned">
        <n-text>Other-Growth Wt:</n-text>
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.greenGrowOtherRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.blueGrowOtherRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.redGrowOtherRate" type="red" />
      </n-form-item-gi>

      <n-form-item-gi class="rightAligned">
        <n-text>Self-Eaten Wt:</n-text>
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.greenEatenSelfRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.blueEatenSelfRate" type="blue" />
      </n-form-item-gi>
      <n-form-item-gi>
      </n-form-item-gi>

      <n-form-item-gi class="rightAligned">
        <n-text>Others-Eaten Wt:</n-text>
      </n-form-item-gi>
      <n-form-item-gi class="centered">
        <variable-input v-model:value="config.greenEatenOtherRate" type="green" />
      </n-form-item-gi>
      <n-form-item-gi class="centered">
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
import { LeafOutline, SunnyOutline } from '@vicons/ionicons5';
import { Meat } from '@vicons/tabler';

const store = useStore();
const config = store.$state.currentConfig;
</script>

<style scoped>
.centered {
  display: flex;
  justify-content: center;
}

.rightAligned {
  display: flex;
  justify-content: flex-end;
  padding-right: 5px;
}
</style>