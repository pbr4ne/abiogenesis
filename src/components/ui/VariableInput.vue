<template>
  <n-input-number
    :value="localValue"
    @update:value="onInputChange"
    button-placement="both"
    size="tiny"
    round
    :style="{ textAlign: 'center' }"
    :theme-overrides="themeOverride()"
  />
</template>
  
<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({
value: {
  type: Number,
  required: true,
},
type: {
  type: String,
  default: 'green',
},
});

const emit = defineEmits(['update:value']);

const localValue = ref(props.value);

watch(
() => props.value,
(newVal) => {
  localValue.value = newVal;
}
);

function onInputChange(newVal: number) {
emit('update:value', newVal);
}

const themeOverride = () => {
  return {
    peers: {
      Input: {
        color: getBlipTypeColor(props.type),
        colorFocus: '#F2C97D',
        textColor: '#333639',
        caretColor: '#FFFFFFD1',
        borderFocus: '1px solid #FFFFFFD1',
      },
      Button: {
        textColorTextHover: '#FFFFFFD1',
        textColorText: '#333639',
      },
    },
  };
};

function getBlipTypeColor(type: string) {
  if (type === 'green') {
    return '#63e2b7';
  }
  if (type === 'blue') {
    return '#70c0e8';
  }
  return '#e88080';
}
</script>
  