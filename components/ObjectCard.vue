<script setup lang="ts">
const props = defineProps({
	obj: Object
})
</script>

<template>
	<v-card>
		<v-card-text v-for="(value, name) in obj" :key="name" class="pt-0 pb-0">
			<template v-if="typeof value !== 'object'">
				<b>{{ name }} : {{ value }} </b>
			</template>
			<template v-else>
				<div v-for="(rowValue, rowIndex) in value" :key="rowIndex" class="mb-2 pa-0">
					<b>{{ name }} : </b>

					<div
						v-for="(rowValue1, rowIndex1) in rowValue"
						:key="rowIndex1"
						class="mb-2 pa-0"
					>
						<b>{{ rowIndex1 }} : </b>
						<div>
							<div v-for="rowValue2 in rowValue1" :key="rowValue2" class="mb-2 pa-0">
								<div
									v-for="(rowValue3, rowIndex3) in rowValue2"
									:key="rowValue3"
									class="mb-2 pa-0"
								>
									<b> {{ rowIndex3 }} : {{ rowValue3 }} </b>
								</div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</v-card-text>
	</v-card>
</template>
