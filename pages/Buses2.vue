<script setup lang="ts">
import type { DataTableHeader, SortItem } from '~/utils/typesVuetify'

const items = busbudJson.trips.map(trip => {
	const priceWithoutBusbudFee =
		(trip.prices[0].prices.total -
			trip.prices[0].prices.breakdown.busbud_fees) /
		100

	const segments = trip.segment_ids.map(segmentId => {
		const segment = busbudJson.related.segments[segmentId]

		const departure_time = new Date(segment.departure_time.timestamp)
		const arrival_time = new Date(segment.arrival_time.timestamp)

		const duration = arrival_time - departure_time
		const hours = Math.floor(duration / 3600000)
		const minutes = Math.floor((duration % 3600000) / 60000)
		const durationStr = `${hours}h ${minutes}m`

		return {
			id: segment.id,
			origin_id: segment.origin_id,
			destination_id: segment.destination_id,
			departure_time,
			arrival_time,
			duration,
			durationStr
		}
	})

	const totalTravellingDuration = segments.reduce((acc, segment) => {
		return acc + segment.duration
	}, 0)

	const totalTravellingDurationStr = (() => {
		const hours = Math.floor(totalTravellingDuration / 3600000)
		const minutes = Math.floor((totalTravellingDuration % 3600000) / 60000)
		return `${hours}h ${minutes}m`
	})()

	const firstSegment = segments[0]
	const lastSegment = segments[segments.length - 1]

	const departure = firstSegment.departure_time
	const arrival = lastSegment.arrival_time

	const departureStr = departure.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit'
	})
	const arrivalStr = arrival.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit'
	})

	const totalDuration = arrival - departure
	const totalDurationStr = (() => {
		const hours = Math.floor(totalDuration / 3600000)
		const minutes = Math.floor((totalDuration % 3600000) / 60000)
		return `${hours}h ${minutes}m`
	})()

	const origin = busbudJson.related.locations[firstSegment.origin_id].name
	const destination =
		busbudJson.related.locations[lastSegment.destination_id].name

	return {
		id: trip.id,
		source: trip.prices[0].source_name,
		segment_ids: trip.segment_ids,
		segments,
		totalDuration,
		totalDurationStr,
		departure,
		arrival,
		departureStr,
		arrivalStr,
		totalTravellingDuration,
		totalTravellingDurationStr,
		priceWithoutBusbudFee,
		origin,
		destination
	}
})

const headers: DataTableHeader = [
	{ title: 'Source', key: 'source' },
	{ title: 'Price', key: 'priceWithoutBusbudFee' },
	{
		title: 'Total Duration',
		key: 'totalDurationStr',
		sortRaw: (a, b) => a.totalDuration - b.totalDuration
	},
	{
		title: 'Total Travelling Duration',
		key: 'totalTravellingDurationStr',
		sortRaw: (a, b) => a.totalTravellingDuration - b.totalTravellingDuration
	},
	{
		title: 'Departure',
		key: 'departureStr',
		sortRaw: (a, b) => a.departure - b.departure
	},
	{
		title: 'Arrival',
		key: 'arrivalStr',
		sortRaw: (a, b) => a.arrival - b.arrival
	},
	{ title: 'Origin', key: 'origin' },
	{ title: 'Destination', key: 'destination' }
]

const search = ref('')
const departureRange = ref<[number, number]>([0, 24])
const arrivalRange = ref<[number, number]>([0, 24])

function getHourOfDay(d: Date) {
	return d.getHours() + d.getMinutes() / 60
}

function formatTime(value: number) {
	const hours = Math.floor(value)
	const minutes = Math.round((value - hours) * 60)
	const isPM = hours >= 12 && hours < 24
	const displayHours = hours % 12 || 12
	return `${displayHours}:${String(minutes).padStart(2, '0')} ${
		isPM ? 'PM' : 'AM'
	}`
}

const filteredItems = computed(() => {
	return items.filter(trip => {
		const depHour = getHourOfDay(trip.departure)
		const arrHour = getHourOfDay(trip.arrival)
		return (
			depHour >= departureRange.value[0] &&
			depHour <= departureRange.value[1] &&
			arrHour >= arrivalRange.value[0] &&
			arrHour <= arrivalRange.value[1]
		)
	})
})
</script>

<template>
	<v-text-field v-model="search"></v-text-field>
	<v-range-slider
		v-model="departureRange"
		:min="0"
		:max="24"
		:step="0.25"
		label="Departure Range"
	>
		<template #prepend>
			{{ formatTime(departureRange[0]) }}
		</template>
		<template #append>
			{{ formatTime(departureRange[1]) }}
		</template>
	</v-range-slider>
	<v-range-slider
		v-model="arrivalRange"
		:min="0"
		:max="24"
		:step="0.25"
		label="Arrival Range"
	>
		<template #prepend>
			{{ formatTime(arrivalRange[0]) }}
		</template>
		<template #append>
			{{ formatTime(arrivalRange[1]) }}
		</template>
	</v-range-slider>
	<v-data-table
		:headers="headers"
		:items="filteredItems"
		:items-per-page="100"
		hover
		density="compact"
		:search="search"
	>
	</v-data-table>
	<ul>
		<!-- <li v-for="trip in busbudJson.trips" :key="trip.id">
			{{ trip.prices[0].source_name }}
		</li> -->
		<li v-for="trip in items" :key="trip.id">
			{{ trip.source }}: ${{ trip.priceWithoutBusbudFee }} |
			{{ trip.totalDurationStr }}
			<ul>
				<li v-for="segment in trip.segments" :key="segment.id">
					{{ segment.id }}:
					{{
						segment.departure_time.toLocaleTimeString('en-US', {
							hour: '2-digit',
							minute: '2-digit'
						})
					}}
					->
					{{
						segment.arrival_time.toLocaleTimeString('en-US', {
							hour: '2-digit',
							minute: '2-digit'
						})
					}}
					| {{ segment.durationStr }}
				</li>
			</ul>
		</li>
	</ul>
</template>
