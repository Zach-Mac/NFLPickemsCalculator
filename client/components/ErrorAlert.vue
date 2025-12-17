<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		error: Error | null
		clearable?: boolean
	}>(),
	{
		clearable: false
	}
)
</script>

<template>
	<v-alert v-if="error" :title="error.name" type="error">
		<p v-if="error.message">Message: {{ error.message }}</p>
		<p v-if="error.cause">Cause: {{ error.cause }}</p>
		<p v-if="error.stack">
			<v-expansion-panels>
				<v-expansion-panel title="Stack Trace" color="error-lighten-3">
					<v-expansion-panel-text>
						<pre>{{ error.stack }}</pre>
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
		</p>
		<br />
		<p v-if="clearable">
			<v-btn @click="$emit('click:close')">Clear Error</v-btn>
		</p>
	</v-alert>
</template>
