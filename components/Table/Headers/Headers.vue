<script setup lang="ts">
import { VDataTable } from 'vuetify/components'

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

type VDataTableSlots = VDataTable['$slots']
type VDataTableHeadersSlot = VDataTableSlots['headers']
type VDataTableHeadersSlotProps = Parameters<NonNullable<VDataTableHeadersSlot>>[0]

interface Props {
	columns: VDataTableHeadersSlotProps['columns']
	isSorted: VDataTableHeadersSlotProps['isSorted']
}
const props = defineProps<Props>()

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
	}
}

const componentType = computed(() => (tableStore.editGamesMode ? 'template' : 'a'))

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
				game.espn?.situation?.isRedZone ? 'bg-error-lighten-4' : '',
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
			<v-tooltip
				v-else-if="
					game.espn.situation &&
					(game.espn.situation.lastPlay?.text || game.espn.situation.downDistanceText)
				"
				activator="parent"
				location="top"
			>
				{{ game.espn.situation.downDistanceText }}
				<br />
				{{ game.espn.situation.lastPlay?.text }}
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
		<template v-for="(value, columnKey) in tableStore.optionalColumns" :key="columnKey">
			<RotatedTableHeader
				v-if="tableStore.optionalColumns[columnKey]"
				@click="tableStore.sortBy = tableStore.sortByOptions[columnKey]"
			>
				{{ tableStore.getHeaderTitle(columnKey) }}
				<SortIcon :columns="columns" :isSorted="isSorted" :keyToSortBy="columnKey" />
				<v-tooltip activator="parent" location="top">
					{{ tableStore.getHeaderSubtitle(columnKey) }}
				</v-tooltip>
			</RotatedTableHeader>
		</template>
	</tr>
</template>

<style scoped>
a.nostyle {
	text-decoration: inherit;
	color: inherit;
}
</style>
