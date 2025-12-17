<script setup lang="ts">
interface Props {
	modelValue: Record<string, any>
	options?: Record<string, any>
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const updateField = (field: string, value: any) => {
	if (getInputType(props.modelValue[field], field) === 'object') {
		try {
			value = JSON.parse(value)
		} catch (e) {
			// Keep as string if invalid JSON
			return
		}
	}
	emit('update:modelValue', { ...props.modelValue, [field]: value })
}

const getInputType = (value: any, key: string) => {
	if (typeof value === 'object' && value !== null) return 'object'
	if (typeof value === 'boolean') return 'checkbox'
	if (typeof value === 'number') return 'number'
	if (props.options && props.options[key]) return 'select'
	return 'text'
}

const formatObjectValue = (value: any) => {
	return typeof value === 'object' ? JSON.stringify(value, null, 2) : value
}
</script>

<template>
	<template v-for="(value, key) in modelValue" :key="key">
		<v-textarea
			v-if="getInputType(value, key) === 'object'"
			:label="key"
			:model-value="formatObjectValue(value)"
			@update:model-value="updateField(key, $event)"
			auto-grow
		/>
		<v-checkbox
			v-else-if="getInputType(value, key) === 'checkbox'"
			:label="key"
			:model-value="value"
			@update:model-value="updateField(key, $event)"
		/>
		<v-select
			v-else-if="getInputType(value, key) === 'select'"
			:label="key"
			:items="options ? options[key] : []"
			:model-value="value"
			@update:model-value="updateField(key, $event)"
		/>
		<v-text-field
			v-else
			:label="key"
			:type="getInputType(value, key)"
			:model-value="value"
			@update:model-value="updateField(key, $event)"
		/>
	</template>
</template>
