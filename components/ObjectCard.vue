<script setup lang="ts">
const props = defineProps({
	obj: {
		type: Object as () => Record<string, any> | any[],
		required: true
	}
})
</script>

<template>
	<v-card class="mt-5 mb-1">
		<v-card-text>
			<NestedItem :obj="obj" :level="0" />
		</v-card-text>
	</v-card>
</template>
