<script setup lang="ts">
const picksStore = usePicksStore()
const gamesStore = useGamesStore()
const tableStore = useTableStore()
const weekOutcomesStore = useWeekOutcomesStore()
const { styleClasses, calculatePercentile, getStyleClass, STYLE_CONFIG } = useTableStyles()

const props = defineProps<{
	playerPicks: PlayerItem
	index: number
}>()

// Computed properties for frequently accessed values
const isCurrentPlayer = computed(() => props.playerPicks.name === picksStore.playerName)

function filterValuesBySign(values: number[], targetValue: number): number[] {
	return values.filter(v => (targetValue > 0 ? v > 0 : v < 0))
}

function getEvTdStyle(name: string): string {
	if (!picksStore.seasonEvs?.[name]) return ''
	const value = picksStore.seasonEvs[name].money
	if (value === 0) return ''

	const allValues = Object.values(picksStore.seasonEvs)
		.map(ev => ev.money)
		.filter(v => v !== 0)
	const filteredValues = filterValuesBySign(allValues, value)
	const percentile = calculatePercentile(value, filteredValues)

	return getStyleClass(value, percentile, value > 0 ? 'success' : 'error')
}
function getEvChangeTdStyle(name: string): string {
	if (!picksStore.seasonEvsChange) return ''
	const value = picksStore.seasonEvsChange[name]
	if (value === 0) return ''

	const allValues = Object.values(picksStore.seasonEvsChange).filter(v => v !== 0)
	const filteredValues = filterValuesBySign(allValues, value)
	const percentile = calculatePercentile(value, filteredValues)

	return getStyleClass(value, percentile, value > 0 ? 'success' : 'error')
}

function getTeamNameTdStyle(pick: string, gameNumber: number) {
	const game = gamesStore.gameData[gameNumber]
	if (!game.winner || game.winner === '') return ''
	if (game.winner === 'tie') return styleClasses.gameTied
	return pick === game.winner ? styleClasses.gameWon : styleClasses.gameLost
}

const rowStyle = computed(() => {
	if (!tableStore.settings.highlightTiedRows) return Array(tableStore.items.length).fill('')

	const colorRow = [false]

	const sortedItems = tableStore.items.sort((a, b) => {
		if (a[tableStore.sortBy[0].key] < b[tableStore.sortBy[0].key])
			return tableStore.sortBy[0].order == 'asc' ? -1 : 1
		if (a[tableStore.sortBy[0].key] > b[tableStore.sortBy[0].key])
			return tableStore.sortBy[0].order == 'asc' ? 1 : -1
		return 0
	})

	for (let i = 1; i < sortedItems.length; i++) {
		const rowSortValue = sortedItems[i][tableStore.sortBy[0].key]
		const prevRowSortValue = sortedItems[i - 1][tableStore.sortBy[0].key]

		if (rowSortValue == prevRowSortValue) {
			colorRow.push(colorRow[i - 1])
		} else {
			colorRow.push(!colorRow[i - 1])
		}
	}

	return colorRow.map(color => (color ? 'bg-grey-lighten-4' : ''))
})

function formatPercent(
	value?: number,
	options: Partial<{ hideZero: boolean; precision: number }> = {}
): string {
	const defaultOptions = {
		hideZero: false,
		precision: 1,
		...options
	}

	if (value == null || Number.isNaN(value)) return '-'

	if (defaultOptions.hideZero && value === 0) return '-'

	const clampedValue = Math.max(0, Math.min(100, value))
	const formattedValue = clampedValue.toFixed(defaultOptions.precision)

	return `${formattedValue}%`
}
</script>

<template>
	<tr class="text-center" :class="[rowStyle[index], isCurrentPlayer ? 'bg-accent' : '']">
		<td class="font-weight-bold text-left border-e">{{ index + 1 }}.</td>
		<td
			class="font-weight-bold text-left cursor-pointer px-1 text-no-wrap border-e"
			@click="picksStore.playerName = playerPicks.name"
		>
			{{ playerPicks.name }}
		</td>
		<td
			class="border-e"
			v-for="(p, gameNumber) in playerPicks.picks"
			:class="getTeamNameTdStyle(p, gameNumber)"
		>
			{{ p }}
		</td>
		<td class="border-e">
			{{ playerPicks.weekTotal }}
		</td>
		<td class="border-e">
			{{ playerPicks.seasonTotal }}
		</td>
		<td class="border-e">{{ playerPicks.tieBreaker }}</td>
		<td class="border-e text-center" v-if="tableStore.optionalColumns.nfeloWinChance">
			<TableSkeletonLoader v-if="weekOutcomesStore.loadingCalculations" />
			<template v-else>
				{{ formatPercent(playerPicks.nfeloWinChance, { hideZero: true }) }}
			</template>
		</td>
		<td class="border-e text-center" v-if="tableStore.optionalColumns.espnWinChance">
			<TableSkeletonLoader v-if="weekOutcomesStore.loadingCalculations" />
			<template v-else>
				{{ formatPercent(playerPicks.espnWinChance, { hideZero: true }) }}
			</template>
		</td>

		<td class="border-e text-center" v-if="tableStore.optionalColumns.winningOutcomesPercent">
			<TableSkeletonLoader v-if="weekOutcomesStore.loadingCalculations" />
			<template v-else>
				{{ formatPercent(playerPicks.winningOutcomesPercent, { hideZero: true }) }}
			</template>
		</td>
		<td
			class="border-e"
			:class="getEvTdStyle(playerPicks.name)"
			v-if="tableStore.optionalColumns.seasonPrizeChance"
		>
			<TableSkeletonLoader v-if="picksStore.seasonEvsEvaluating" />
			<template v-else>
				{{ formatPercent(playerPicks.seasonPrizeChance) }}
			</template>
		</td>
		<td
			class="border-e"
			:class="getEvTdStyle(playerPicks.name)"
			v-if="tableStore.optionalColumns.chanceMake100"
		>
			<TableSkeletonLoader v-if="picksStore.seasonEvsEvaluating" />
			<template v-else>
				{{ formatPercent(playerPicks.chanceMake100) }}
			</template>
		</td>
		<td
			class="border-e"
			:class="getEvTdStyle(playerPicks.name)"
			v-if="tableStore.optionalColumns.seasonEv"
		>
			<TableSkeletonLoader v-if="picksStore.seasonEvsEvaluating" />
			<template v-else>
				{{ playerPicks.seasonEv ?? '-' }}
			</template>
		</td>
		<td
			class="border-e"
			:class="getEvChangeTdStyle(playerPicks.name)"
			v-if="tableStore.optionalColumns.evChange"
		>
			<TableSkeletonLoader v-if="picksStore.seasonEvsEvaluating" />
			<template v-else>
				{{ playerPicks.evChange ?? '-' }}
			</template>
		</td>
	</tr>
</template>

<style scoped>
.py-05 {
	padding-block: 2px;
}
</style>
