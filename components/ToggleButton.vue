<script setup lang="ts">
interface Props {
	iconToggled?: string
	iconUntoggled?: string
	variantToggled?: 'outlined' | 'elevated' | 'flat' | 'text' | 'tonal' | 'plain'
	variantUntoggled?: 'outlined' | 'elevated' | 'flat' | 'text' | 'tonal' | 'plain'
}

const props = withDefaults(defineProps<Props>(), {
	variantToggled: 'outlined',
	variantUntoggled: 'elevated'
})

const toggled = defineModel()

const icon = computed(() => (toggled.value ? props.iconToggled : props.iconUntoggled))
const variant = computed(() => (toggled.value ? props.variantToggled : props.variantUntoggled))
</script>

<template>
	<v-btn :icon="icon" @click="toggled = !toggled" :variant="variant"></v-btn>
</template>
