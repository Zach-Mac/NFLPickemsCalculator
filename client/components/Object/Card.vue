<script setup lang="ts">
const props = defineProps({
	obj: {
		type: Object as () => Record<string, any> | any[],
		required: true
	}
})
</script>

<template>
	<v-card>
		<v-card-text>
			<ObjectNestedItem :obj="obj" />
		</v-card-text>
	</v-card>
</template>
