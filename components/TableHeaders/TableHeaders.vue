<script setup lang="ts">
import type { UnwrapRef } from 'vue'
import type { IconValue, InternalDataTableHeader, provideSort } from '~/utils/typesVuetify'

const gamesStore = useGamesStore()
const tableStore = useTableStore()
const { smAndDown, mdAndDown } = useDisplay()

const quarters = ['1st', '2nd', '3rd', '4th']

const rankText = computed(() => (mdAndDown.value ? 'R' : 'Rank'))
// const weekText = computed(() => (mdAndDown.value ? 'W' : 'Week'))
// const seasonText = computed(() => (mdAndDown.value ? 'S' : 'Season'))
// const tieBreakerText = computed(() => (mdAndDown.value ? 'TB' : 'Tie Breaker'))
// const rankText = 'Rank'
const weekText = 'Week'
const seasonText = 'Season'
const tieBreakerText = 'Tie Breaker'

interface HeadersSlotProps {
	headers: InternalDataTableHeader[][]
	columns: InternalDataTableHeader[]
	sortBy: UnwrapRef<ReturnType<typeof provideSort>['sortBy']>
	someSelected: boolean
	allSelected: boolean
	toggleSort: ReturnType<typeof provideSort>['toggleSort']
	selectAll: (value: boolean) => void
	getSortIcon: (column: InternalDataTableHeader) => IconValue
	isSorted: ReturnType<typeof provideSort>['isSorted']
}
const props = defineProps<HeadersSlotProps>()

const ballPossessionClasses = 'bg-primary-lighten-3 text-black px-1 py-05 border'

function getGameStatusText(game: Game) {
	if (game.state == 'finished') return 'Final'
	if (game.state == 'active') return game.timeLeft

	if (!game.date) return 'Date Err'
	const gameDate = new Date(game.date)

	const options: Intl.DateTimeFormatOptions = {}
	if (mdAndDown.value) {
		options.month = '2-digit'
		options.day = '2-digit'
	}

	return gameDate.toLocaleDateString(undefined, options)
}
function getGameQuarterText(game: Game) {
	if (game.ot) return 'OT'
	if (game.state == 'active') return quarters[Number(game.quarter) - 1]
	if (game.state == 'finished') return ''

	if (!game.date) return 'Date Err'
	const gameDate = new Date(game.date)

	const options: Intl.DateTimeFormatOptions = {
		weekday: 'short'
	}

	const day = gameDate?.toLocaleDateString(undefined, options)
	let hours = gameDate?.getHours()
	const minutesNum = gameDate?.getMinutes() ?? 0
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

function onGameClick(game: Game, index: number) {
	if (tableStore.editGamesMode) {
		gamesStore.editGame(index)
	} else {
	}
}

const componentType = computed(() => (tableStore.editGamesMode ? 'template' : 'a'))

const lastThContent = ref()
const { width, height } = useElementSize(lastThContent)
const lastThStyle = computed(() => {
	const w = width.value / 1.8
	return {
		maxWidth: w + 'px !important'
	}
})

const headerRow = ref()
const numHeaders = computed(() => headerRow.value?.children.length ?? 0)
provide('numHeaders', numHeaders)
</script>

<template>
	<TableHeadersGameWinChances />
	<TableHeadersSelectGameWinners />

	<tr ref="headerRow">
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
			<div
				class="cursor-pointer text-center"
				@click="tableStore.sortBy = tableStore.sortByOptions.name"
			>
				Player Name
			</div>
		</th>
		<th
			v-for="(game, index) in gamesStore.gameData"
			class="cursor-pointer text-center font-weight-bold border-e"
			:class="[
				game.state == 'finished' ? 'dimmed' : '',
				tableStore.editGamesMode ? 'bg-primary-lighten-4' : ''
			]"
			@click="onGameClick(game, index)"
		>
			<component
				:is="componentType"
				class="nostyle d-block"
				:href="game.espn.gamecastLink"
				target="_blank"
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
			</component>

			<v-tooltip v-if="tableStore.editGamesMode" activator="parent" location="top">
				Click to edit game
			</v-tooltip>
			<v-tooltip v-else-if="game.espn.situation" activator="parent" location="top">
				{{ game.espn.situation?.lastPlay.text }}
				Click to see Gamecast
			</v-tooltip>
		</th>
		<th>
			<span class="opacity-0">
				{{ weekText }}
			</span>
		</th>
		<RotatedTableHeader @click="tableStore.sortBy = tableStore.sortByOptions.weekTotal">
			{{ weekText }}
			<SortIcon :columns="columns" :isSorted="isSorted" keyToSortBy="weekTotal" />
		</RotatedTableHeader>
		<RotatedTableHeader @click="tableStore.sortBy = tableStore.sortByOptions.seasonTotal">
			{{ seasonText }}
			<SortIcon :columns="columns" :isSorted="isSorted" keyToSortBy="seasonTotal" />
		</RotatedTableHeader>
		<RotatedTableHeader>
			{{ tieBreakerText }}
		</RotatedTableHeader>
		<RotatedTableHeader @click="tableStore.sortBy = tableStore.sortByOptions.nfeloWinChance">
			nfelo Win %
			<SortIcon :columns="columns" :isSorted="isSorted" keyToSortBy="nfeloWinChance" />
			<v-tooltip activator="parent" location="top">
				Chance of winning based on nfelo predictions
			</v-tooltip>
		</RotatedTableHeader>
		<RotatedTableHeader
			@click="tableStore.sortBy = tableStore.sortByOptions.winningOutcomesPercent"
		>
			Win Outcomes %
			<SortIcon
				:columns="columns"
				:isSorted="isSorted"
				keyToSortBy="winningOutcomesPercent"
			/>
			<v-tooltip activator="parent" location="top">
				Percentage of winning outcomes with selected game winners
			</v-tooltip>
		</RotatedTableHeader>
		<RotatedTableHeader @click="tableStore.sortBy = tableStore.sortByOptions.seasonEv">
			Season EV
			<SortIcon :columns="columns" :isSorted="isSorted" keyToSortBy="seasonEv" />
			<v-tooltip activator="parent" location="top">
				Expected season winnings based on selected winners (in $)
			</v-tooltip>
		</RotatedTableHeader>
		<RotatedTableHeader
			@click="tableStore.sortBy = tableStore.sortByOptions.evChange"
			:style="lastThStyle"
		>
			<div ref="lastThContent">
				EV Δ
				<SortIcon :columns="columns" :isSorted="isSorted" keyToSortBy="evChange" />
				<v-tooltip activator="parent" location="top">
					Difference in expected season winnings from last week (in $)
				</v-tooltip>
			</div>
		</RotatedTableHeader>
	</tr>
</template>

<style scoped>
a.nostyle {
	text-decoration: inherit;
	color: inherit;
}
</style>
