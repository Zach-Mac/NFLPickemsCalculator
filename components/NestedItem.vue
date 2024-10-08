<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps({
	obj: {
		type: Object as () => Record<string, any> | any[],
		required: true
	},
	level: {
		type: Number,
		default: 0
	}
})

// Helper to check if a value is primitive (string, number, etc.)
const isPrimitive = (val: any) => {
	return typeof val !== 'object' || val === null
}

// Helper to check if an array contains only primitives
const isArrayOfPrimitives = (arr: any) => {
	return Array.isArray(arr) && arr.every(isPrimitive)
}
</script>

<template>
	<div :style="{ paddingLeft: 20 + 'px' }">
		<template v-if="isArrayOfPrimitives(obj)">
			<b>{{ obj }}</b>
		</template>
		<template v-else-if="Array.isArray(obj)">
			<b>[</b>
			<NestedItem v-for="(item, index) in obj" :key="index" :obj="item" :level="level" />
			<b>]</b>
		</template>
		<template v-else>
			<div v-for="(value, key) in obj" :key="key">
				<template v-if="isPrimitive(value) || isArrayOfPrimitives(value)">
					<b>{{ key }}: {{ value }}</b>
				</template>
				<template v-else>
					<b>{{ key }}: </b>
					<NestedItem :obj="value" :level="level + 1" />
				</template>
			</div>
		</template>
	</div>
</template>
