<template>
	<n-input-number 
		:value="value" 
		button-placement="both" 
		size="tiny" 
		round 
		:style="{ textAlign: 'center' }"
		:theme-overrides="themeOverride()"
	>
	</n-input-number>
</template>
<script setup lang="ts">
const { value, type } = defineProps({
  value: {
	type: Number,
	required: true,
  },
	type: {
		type: String,
		default: 'green',
	},
});

const themeOverride = () => {
	return {
		peers: { 
			Input: { 
				color: getBlipTypeColor(type), 
				colorFocus: "#F2C97D",
				textColor: "#333639",
				caretColor: "#FFFFFFD1",
				borderFocus: "1px solid #FFFFFFD1"
			},
			Button: {
				textColorTextHover: "#FFFFFFD1",
				textColorText: "#333639"
			}
		} 
	}
}

const getBlipTypeColor = (type: string) => {
	if (type === 'green') {
		return '#63e2b7';
	} else if (type === 'blue') {
		return '#70c0e8';
	} else if (type === 'red') {
		return '#e88080';
	}
}
</script>
