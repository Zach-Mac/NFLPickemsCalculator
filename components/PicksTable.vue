<script setup lang="ts">
const gamesStore = useGamesStore()
const picksStore = usePicksStore()
const { smAndDown, mdAndDown } = useDisplay()

const quarters = ['1st', '2nd', '3rd', '4th']

const rankText = computed(() => (mdAndDown.value ? 'R' : 'Rank'))
const weekText = computed(() => (mdAndDown.value ? 'W' : 'Week'))
const seasonText = computed(() => (mdAndDown.value ? 'S' : 'Season'))
const tieBreakerText = computed(() => (mdAndDown.value ? 'TB' : 'Tie Break'))

const gameWonClasses = 'bg-success-lighten-2 text-success-darken-2 font-weight-bold'
const gameLostClasses = 'bg-error-lighten-2 text-error line-through font-weight-bold'
const gameTiedClasses = 'bg-accent text-accent-darken-4 font-weight-bold'

function getTeamNameTdStyle(pick: string, gameNumber: number) {
	const game = gamesStore.gameData[gameNumber]

	if (!game.winner || game.winner == '') return ''
	if (game.winner == 'tie') return gameTiedClasses
	if (pick == game.winner) return gameWonClasses
	return gameLostClasses
}

const items = computed(() => {
	return picksStore.picksData.map(playerPicks => {
		return {
			name: playerPicks.name,
			picks: playerPicks.picks,
			weekTotal: picksStore.playerTotals[playerPicks.name]?.weekTotal || 0,
			seasonTotal: picksStore.playerTotals[playerPicks.name]?.seasonTotal || 0,
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
	if (!picksStore.highlightTiedRows) return Array(items.value.length).fill('')

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

function getGameStatusText(game: Game) {
	if (game.state == 'finished') return 'Final'
	if (game.state == 'active') return game.timeLeft

	const options: Intl.DateTimeFormatOptions = {}

	if (mdAndDown.value) {
		options.month = '2-digit'
		options.day = '2-digit'
	}
	return game.date?.toLocaleDateString(undefined, options)
}
function getGameQuarterText(game: Game) {
	if (game.ot) return 'OT'
	if (game.state == 'active') return quarters[Number(game.quarter) - 1]
	if (game.state == 'finished') return ''

	const options: Intl.DateTimeFormatOptions = {
		weekday: 'short'
	}
	const day = game.date?.toLocaleDateString(undefined, options)
	let hours = game.date?.getHours()
	const minutesNum = game.date?.getMinutes() ?? 0
	const minutes = minutesNum < 10 ? '0' + minutesNum : minutesNum.toString()

	let amPm = ''
	if (hours! < 12) {
		amPm = 'AM'
	} else {
		amPm = 'PM'
		hours! -= 12
	}

	if (smAndDown.value) return `${day} ${hours}`
	if (mdAndDown.value) return `${day} ${hours}${amPm}`

	return `${day} ${hours}:${minutes}${amPm}`
}
</script>

<template>
	<v-data-table
		v-bind="$attrs"
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
				<th class="text-right font-weight-bold w-0 border-e pe-1">
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
					v-for="game in gamesStore.gameData"
					class="text-center font-weight-bold border-e"
					:class="[game.state == 'finished' ? 'dimmed' : '']"
				>
					{{ game.state != 'upcoming' ? game.scoreHome : '' }}
					<br />
					<span :class="game.possession == 'home' ? ballPossessionClasses : ''">
						{{ game.home }}
					</span>
					<br />
					<span :class="game.possession == 'away' ? ballPossessionClasses : ''">
						{{ game.away }}
					</span>
					<br />
					{{ game.state != 'upcoming' ? game.scoreAway : '' }}
					<br />
					<span class="text-no-wrap">
						{{ getGameStatusText(game) }}
					</span>
					<br />
					<span class="text-no-wrap">
						{{ getGameQuarterText(game) }}
					</span>
					<br />

					<!-- <v-tooltip activator="parent" location="top">
						{{ game.espnSituation?.lastPlay.text }}
					</v-tooltip> -->
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
				<td>{{ playerPicks.tieBreaker }}</td>
			</tr>
		</template>
	</v-data-table>
</template>

<style scoped>
.line-through {
	text-decoration: line-through;
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
