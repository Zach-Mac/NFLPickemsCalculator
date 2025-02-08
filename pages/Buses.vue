<script setup lang="ts">
const locations = {
	ottawa: 'f244m6',
	london: 'dpwhx2',
	toronto: 'dpz88g'
}

const LOC = {
	ottawa: 'f244m6',
	london: 'dpwhx2',
	toronto: 'dpz88g'
}

const baseUrl =
	'https://www.busbud.com/en-ca/bus-schedules-results/f244m6/dpwhx2?outbound_date=2025-02-07&adults=1'

function getUrl(origin: string, dest: string, date: string) {
	// return `https://www.busbud.com/en-ca/bus-schedules-results/${locations[origin]}/${locations[dest]}?outbound_date=${date}&adults=1`
	return `https://www.busbud.com/en-ca/bus-schedules-results/${origin}/${dest}?outbound_date=${date}&adults=1`
}

const cols = ref(3)
const defaultDate = '2025-02-07'

// Replace dates ref with selectedDates ref to store user selections
const selectedDates = ref<Date[]>([])

// Modified to use first selected date or default date
const defaultDates = computed(() => {
	const baseDate = selectedDates.value[0] || new Date(defaultDate)
	return Array.from({ length: cols.value }, (_, i) => {
		const date = new Date(baseDate)
		date.setDate(date.getDate() + i)
		return date
	})
})

// Keep selectedDates in sync with cols
watchEffect(() => {
	// Extend array if needed with default dates
	while (selectedDates.value.length < cols.value) {
		const index = selectedDates.value.length
		selectedDates.value.push(defaultDates.value[index])
	}
	// Truncate if cols decreased
	if (selectedDates.value.length > cols.value) {
		selectedDates.value.length = cols.value
	}
})

const dateStrs = computed(() =>
	selectedDates.value.map(date => date.toISOString().split('T')[0])
)
</script>

<template>
	<v-row>
		<v-number-input v-model="cols" :min="1" :max="10" label="Columns" />
	</v-row>
	<v-row>
		<v-col v-for="(_, i) in cols" :key="i">
			<v-date-picker v-model="selectedDates[i]" />
			{{ dateStrs[i] }}
			<div>
				<h1>Buses</h1>
				<ul>
					<li>
						<a :href="getUrl(LOC.ottawa, LOC.london, dateStrs[i])">
							Ottawa to London
						</a>
					</li>
					<li>
						<a :href="getUrl(LOC.ottawa, LOC.toronto, dateStrs[i])">
							Ottawa to Toronto
						</a>
					</li>
					<li>
						<a :href="getUrl(LOC.toronto, LOC.london, dateStrs[i])">
							Toronto to London
						</a>
					</li>
					<br />
					<li>
						<a :href="getUrl(LOC.london, LOC.ottawa, dateStrs[i])">
							London to Ottawa
						</a>
					</li>
					<li>
						<a :href="getUrl(LOC.london, LOC.toronto, dateStrs[i])">
							London to Toronto
						</a>
					</li>
					<li>
						<a :href="getUrl(LOC.toronto, LOC.ottawa, dateStrs[i])">
							Toronto to Ottawa
						</a>
					</li>
				</ul>
			</div>
		</v-col>
	</v-row>
</template>
