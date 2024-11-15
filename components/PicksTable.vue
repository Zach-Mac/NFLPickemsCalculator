<script setup lang="ts">
const gamesStore = useGamesStore()
const picksStore = usePicksStore()
const weekOutcomesStore = useWeekOutcomeStore()
const tableStore = useTableStore()

const gameWonClasses = 'bg-success-lighten-2 text-success-darken-2 font-weight-bold'
const gameLostClasses = 'bg-error-lighten-2 text-error line-through font-weight-bold'
const gameTiedClasses = 'bg-accent text-accent-darken-4 font-weight-bold'

function getEvChangeTdStyle(name: string) {
	if (!picksStore.seasonEvsChange) return ''
	const value = picksStore.seasonEvsChange[name]
	if (value === 0) return ''

	// Get all non-zero values for percentile calculation
	const allValues = Object.values(picksStore.seasonEvsChange).filter(v => v !== 0)
	const values = value > 0 ? allValues.filter(v => v > 0) : allValues.filter(v => v < 0)
	const percentile =
		values.filter(v => (value > 0 ? v <= value : v >= value)).length / values.length

	// Map percentile to lighten class
	const conversion = 1 + (1 - percentile) * 5
	const brightnessLevel = Math.abs(Math.round(conversion))
	const baseClass = value > 0 ? 'success' : 'error'

	const bold = percentile > 0.9 ? ' font-weight-bold' : ''

	const output = `bg-${baseClass}-lighten-${brightnessLevel} ${bold}`

	return output
}

function getEvTdStyle(name: string) {
	if (!picksStore.seasonEvs) return ''
	const value = picksStore.seasonEvs[name].money
	if (value === 0) return ''

	// Get all non-zero values for percentile calculation
	const allValues = Object.values(picksStore.seasonEvs).filter(v => v.money !== 0)
	const values =
		value > 0 ? allValues.filter(v => v.money > 0) : allValues.filter(v => v.money < 0)
	const percentile =
		values.filter(v => (value > 0 ? v.money <= value : v.money >= value)).length / values.length

	// Map percentile to lighten class
	const conversion = 1 + (1 - percentile) * 5
	let brightnessLevel = Math.abs(Math.round(conversion))
	const baseClass = value > 0 ? 'success' : 'error'
	const bold = percentile > 0.9 ? ' font-weight-bold' : ''

	if (baseClass == 'error' && brightnessLevel == 1) brightnessLevel = 2

	const output = `bg-${baseClass}-lighten-${brightnessLevel} ${bold}`
	return output
}

function getTeamNameTdStyle(pick: string, gameNumber: number) {
	const game = gamesStore.gameData[gameNumber]

	if (!game.winner || game.winner == '') return ''
	if (game.winner == 'tie') return gameTiedClasses
	if (pick == game.winner) return gameWonClasses
	return gameLostClasses
}

const items = computed<PlayerItem[]>(() => {
	return picksStore.picksData.map(playerPicks => {
		return {
			name: playerPicks.name,
			picks: playerPicks.picks,
			weekTotal: picksStore.playerTotals[playerPicks.name]?.weekTotal || 0,
			seasonTotal: picksStore.playerTotals[playerPicks.name]?.seasonTotal || 0,
			tieBreaker: playerPicks.tieBreaker,
			nfeloWinChance: weekOutcomesStore.liveStatsComputed.nfeloChance[playerPicks.name],
			winningOutcomesPercent:
				weekOutcomesStore.liveStatsComputed.winningOutcomesPercent[playerPicks.name],
			seasonPrizeChance: picksStore.seasonEvs?.[playerPicks.name].chance || 0,
			chanceMake100: picksStore.seasonEvs?.[playerPicks.name].chanceOver100 || 0,
			seasonEv: picksStore.seasonEvs?.[playerPicks.name].money || 0,
			evChange: picksStore.seasonEvsChange?.[playerPicks.name] || 0
		}
	})
})

const rowStyle = computed(() => {
	if (!picksStore.highlightTiedRows) return Array(items.value.length).fill('')

	const colorRow = [false]

	const sortedItems = items.value.sort((a, b) => {
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

function displayPercentage(value?: number) {
	if (!value) return '-'
	return Math.round(value * 10) / 10 + '%'
}
</script>

<template>
	<v-data-table
		v-bind="$attrs"
		:items="items"
		:headers="tableStore.headers"
		:items-per-page="50"
		density="compact"
		hover
		class="border"
		multi-sort
		:sort-by="tableStore.sortBy"
	>
		<template v-slot:headers="props">
			<TableHeaders v-bind="props" />
		</template>
		<template v-slot:item="{ item: playerPicks, index }">
			<tr
				class="text-center"
				:class="[
					rowStyle[index],
					playerPicks.name == picksStore.playerName ? 'bg-accent' : ''
				]"
			>
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
				<td
					class="border-e text-center"
					v-if="tableStore.showOptionalColumns.nfeloWinChance"
				>
					<v-skeleton-loader
						v-if="weekOutcomesStore.loadingCalculations"
						class="ma-0 pa-0 mx-auto text-center"
						type="text"
						width="3em"
					>
					</v-skeleton-loader>
					<template v-else>
						{{
							displayPercentage(
								weekOutcomesStore.liveStatsComputed.nfeloChance[playerPicks.name]
							)
						}}
					</template>
				</td>
				<td
					class="border-e text-center"
					v-if="tableStore.showOptionalColumns.winningOutcomesPercent"
				>
					<v-skeleton-loader
						v-if="weekOutcomesStore.loadingCalculations"
						class="ma-0 pa-0 mx-auto text-center"
						type="text"
						width="3em"
					>
					</v-skeleton-loader>
					<template v-else>
						{{
							displayPercentage(
								weekOutcomesStore.liveStatsComputed.winningOutcomesPercent[
									playerPicks.name
								]
							)
						}}
					</template>
				</td>
				<td
					class="border-e"
					:class="getEvTdStyle(playerPicks.name)"
					v-if="tableStore.showOptionalColumns.seasonPrizeChance"
				>
					{{ displayPercentage(picksStore.seasonEvs?.[playerPicks.name].chance) }}
				</td>
				<td
					class="border-e"
					:class="getEvTdStyle(playerPicks.name)"
					v-if="tableStore.showOptionalColumns.chanceMake100"
				>
					{{ displayPercentage(picksStore.seasonEvs?.[playerPicks.name].chanceOver100) }}
				</td>
				<td
					class="border-e"
					:class="getEvTdStyle(playerPicks.name)"
					v-if="tableStore.showOptionalColumns.seasonEv"
				>
					{{ picksStore.seasonEvs ? picksStore.seasonEvs[playerPicks.name].money : '-' }}
				</td>
				<td
					class="border-e"
					:class="getEvChangeTdStyle(playerPicks.name)"
					v-if="tableStore.showOptionalColumns.evChange"
				>
					{{ picksStore.seasonEvsChange[playerPicks.name] ?? '-' }}
				</td>
			</tr>
		</template>
	</v-data-table>
</template>

<style>
.line-through {
	text-decoration: line-through;
}

.v-skeleton-loader__bone {
	margin: 0 !important;
}

.pa-05 {
	padding: 2px !important;
}
.px-05 {
	padding-left: 2px !important;
	padding-right: 2px !important;
}
.py-05 {
	padding-top: 2px !important;
	padding-bottom: 2px !important;
}
</style>
