<script setup lang="ts">
const { playerName, highlightTiedRows } = useUserInput()
const { smAndDown } = useDisplay()

const rankText = computed(() => (smAndDown.value ? 'R' : 'Rank'))
const weekText = computed(() => (smAndDown.value ? 'W' : 'Week'))
const seasonText = computed(() => (smAndDown.value ? 'S' : 'Season'))
const tieBreakerText = computed(() => (smAndDown.value ? 'TB' : 'Tie Breaker'))

const gameWonClasses = 'bg-success-lighten-2 text-success-darken-2 font-weight-bold'
const gameLostClasses = 'bg-error-lighten-2 text-error line-through font-weight-bold'
const gameTiedClasses = 'bg-accent text-accent-darken-4 font-weight-bold'

function getTeamNameTdStyle(pick: string, gameNumber: number) {
	const game = gameData.value[gameNumber]

	if (!game.winner || game.winner == '') return ''
	if (game.winner == 'tie') return gameTiedClasses
	if (pick == game.winner) return gameWonClasses
	return gameLostClasses
}

const items = computed(() => {
	return picksData.value.map(playerPicks => {
		return {
			name: playerPicks.name,
			picks: playerPicks.picks,
			weekTotal: playerTotals.value[playerPicks.name].weekTotal,
			seasonTotal: playerTotals.value[playerPicks.name].seasonTotal,
			tieBreaker: playerPicks.tieBreaker
		}
	})
})
const headers = ref([
	{ key: 'name', title: 'Name', value: 'name', sortable: true },
	{ key: 'picks', title: 'Picks', value: 'picks', sortable: true },
	{ key: 'weekTotal', title: 'WeekTotal', value: 'weekTotal', sortable: true },
	{ key: 'seasonTotal', title: 'SeasonTotal', value: 'seasonTotal', sortable: true },
	{ key: 'tieBreaker', title: 'TieBreaker', value: 'tieBreaker', sortable: true }
])

type HeaderKey = 'name' | 'picks' | 'weekTotal' | 'seasonTotal' | 'tieBreaker'
interface SortBy {
	key: HeaderKey
	order: boolean | 'desc' | 'asc' | undefined
}

const sortByOptions: Record<string, SortBy[]> = {
	weekTotal: [
		{ key: 'weekTotal', order: 'desc' },
		{ key: 'tieBreaker', order: 'asc' }
	],
	seasonTotal: [
		{ key: 'seasonTotal', order: 'desc' },
		{ key: 'tieBreaker', order: 'asc' }
	],
	tieBreaker: [{ key: 'tieBreaker', order: 'desc' }],
	name: [{ key: 'name', order: 'asc' }]
}

const sortBy = ref(sortByOptions.weekTotal)

const ballPossessionClasses = 'bg-primary-lighten-3 text-black px-1 py-05 border'

const rowStyle = computed(() => {
	if (!highlightTiedRows.value) return Array(items.value.length).fill('')

	const colorRow = [false]

	const sortedItems = items.value.sort((a, b) => {
		if (a[sortBy.value[0].key] < b[sortBy.value[0].key])
			return sortBy.value[0].order == 'asc' ? -1 : 1
		if (a[sortBy.value[0].key] > b[sortBy.value[0].key])
			return sortBy.value[0].order == 'asc' ? 1 : -1
		return 0
	})

	for (let i = 1; i < sortedItems.length; i++) {
		const rowSortValue = sortedItems[i][sortBy.value[0].key]
		const prevRowSortValue = sortedItems[i - 1][sortBy.value[0].key]

		if (rowSortValue == prevRowSortValue) {
			colorRow.push(colorRow[i - 1])
		} else {
			colorRow.push(!colorRow[i - 1])
		}
	}

	return colorRow.map(color => (color ? 'bg-grey-lighten-4' : ''))
})
</script>

<template>
	<v-data-table
		:items="items"
		:headers="headers"
		:items-per-page="50"
		density="compact"
		hover
		class="border"
		multi-sort
		:sort-by="sortBy"
	>
		<template v-slot:headers="{ columns, isSorted, getSortIcon, toggleSort }">
			<SelectGameWinnersHeaders />
			<tr>
				<th class="text-center font-weight-bold w-0 border-e">
					<br /><br /><br /><br /><br />
					{{ rankText }}
				</th>
				<th class="text-right font-weight-bold w-0 border-e">
					Score:
					<br />
					Home:
					<br />
					Away:
					<br />
					Score:
					<br />
					Status:
					<br />
					<div class="cursor-pointer text-center" @click="sortBy = sortByOptions.name">
						Player Name
					</div>
				</th>
				<th
					v-for="game in gameData"
					class="text-center font-weight-bold border-e"
					:class="[game.state == 'finished' ? 'dimmed' : '']"
				>
					{{ game.state != 'upcoming' ? game.scoreHome : '' }}
					<br />
					<span
						:class="game.teamWithPossession == game.home ? ballPossessionClasses : ''"
					>
						{{ game.home }}
					</span>
					<br />
					<span
						:class="game.teamWithPossession == game.away ? ballPossessionClasses : ''"
					>
						{{ game.away }}
					</span>
					<br />
					{{ game.state != 'upcoming' ? game.scoreAway : '' }}
					<br />
					{{ game.state == 'finished' ? 'Final' : game.timeLeft }}
					<br />
					{{ game.ot ? 'OT' : game.quarter }}
					<br />
				</th>
				<th
					class="cursor-pointer text-center font-weight-bold pr-md-1 border-e"
					@click="sortBy = sortByOptions.weekTotal"
				>
					<br /><br /><br /><br /><br />
					<div class="pl-lg-3 d-flex justify-center">
						{{ weekText }}
						<v-icon
							class="v-data-table-header__sort-icon"
							:class="isSorted(columns.at(-3)!) ? 'opacity-100' : ''"
							icon="mdi-arrow-down"
						/>
					</div>
				</th>
				<th
					class="cursor-pointer text-center font-weight-bold pr-md-1 border-e"
					@click="sortBy = sortByOptions.seasonTotal"
				>
					<br /><br /><br /><br /><br />
					<div class="pl-lg-3 d-flex justify-center">
						{{ seasonText }}
						<v-icon
							class="v-data-table-header__sort-icon"
							:class="isSorted(columns.at(-2)!) ? 'opacity-100' : ''"
							icon="mdi-arrow-down"
						/>
					</div>
				</th>
				<th class="text-center font-weight-bold" @click="sortBy = sortByOptions.tieBreaker">
					<br /><br /><br /><br /><br />
					<div class="d-flex justify-center">{{ tieBreakerText }}</div>
				</th>
			</tr>
		</template>
		<template v-slot:item="{ item: playerPicks, index }">
			<tr
				class="text-center"
				:class="[rowStyle[index], playerPicks.name == playerName ? 'bg-accent' : '']"
			>
				<td class="font-weight-bold text-left border-e">{{ index + 1 }}.</td>
				<td
					class="font-weight-bold text-left cursor-pointer px-1 text-no-wrap border-e"
					@click="playerName = playerPicks.name"
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
				<td>{{ playerPicks.tieBreaker }}</td>
			</tr>
		</template>
	</v-data-table>
</template>

<style scoped>
.line-through {
	text-decoration: line-through;
}
</style>
