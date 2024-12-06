<script setup lang="ts">
const picksStore = usePicksStore()
const gamesStore = useGamesStore()
const nfeloStore = useNfeloStore()
const espnAnalyticsStore = useEspnAnalyticsStore()

const weekOutcomesStore = useWeekOutcomesStore()

// Styling
function getWeekImportanceColor(index: number) {
	const score = weekOutcomesStore.gamesImportanceScores[index]

	let level = 5 - Math.round(score / 20) + 1
	if (level < 1) level = 1

	return `bg-purple-lighten-${level}`
}
function evDiffColor(evDiff: number) {
	// lighten as percentile of all ev diffs
	const allValues = Object.values(picksStore.userGameEvRanges).filter(v => v !== 0)
	const values = evDiff > 0 ? allValues.filter(v => v > 0) : allValues.filter(v => v < 0)
	const percentile =
		values.filter(v => (evDiff > 0 ? v <= evDiff : v >= evDiff)).length / values.length

	const conversion = 1 + (1 - percentile) * 5

	const brightnessLevel = Math.abs(Math.round(conversion))
	const output = `bg-light-green-lighten-${brightnessLevel}`
	return output
}

// nfelo
const getNfeloWinChance = (gameIndex: number) => {
	if (!picksStore.user || !picksStore.user.picks.length) return 0
	return nfeloStore.nfeloTeamsWinChance[picksStore.user.picks[gameIndex]] + '%'
}
const getNfeloWinChanceMean = () => {
	if (!picksStore.user) return 0

	const total = picksStore.user.picks.reduce((acc, pick) => {
		return acc + nfeloStore.nfeloTeamsWinChance[pick]
	}, 0)

	return total / picksStore.user.picks.length
}
const nfeloChancesExist = computed(() => {
	return nfeloStore.nfeloTeamsWinChance && Object.keys(nfeloStore.nfeloTeamsWinChance).length > 0
})

// espn
const getEspnWinProb = (gameIndex: number) => {
	const prob = espnAnalyticsStore.espnTeamsWinChances[picksStore.user.picks[gameIndex]]
	return prob !== undefined ? round(prob, 4) + '%' : ''
}
const getEspnWinProbMean = () => {
	const total = picksStore.user.picks.reduce((acc, pick) => {
		const prob = espnAnalyticsStore.espnTeamsWinChances[pick]
		return prob !== undefined ? acc + prob : acc
	}, 0)

	return total / picksStore.user.picks.length
}

const numTotalHeaders = inject<Ref<number>>('numHeaders') ?? ref(0)
const headerRow = ref()
const numCurrentHeaders = computed(() => headerRow.value?.children.length ?? 0)
const numHeadersNeeded = computed(() => {
	return numTotalHeaders.value - numCurrentHeaders.value
})
</script>

<template>
	<tr>
		<th class="text-center font-weight-bold border-e cursor-help text-no-wrap" :colspan="2">
			Season Importance
			<v-tooltip activator="parent" location="top">
				Season EV difference between winning and losing this game ($)
			</v-tooltip>
		</th>
		<th
			v-for="(game, index) in gamesStore.gameData"
			class="text-center border-e"
			:class="[
				game.state == 'finished' ? 'dimmed' : '',
				evDiffColor(picksStore.userGameEvRanges[index])
			]"
		>
			{{ game.state == 'finished' ? '-' : picksStore.userGameEvRanges[index] }}
		</th>
		<th :colspan="numHeadersNeeded" class="px-1">
			<v-btn
				@click="picksStore.calcUserGameEvRanges"
				density="compact"
				slim
				:loading="picksStore.gameEvRangesLoading"
				:color="!picksStore.gameEvRangesCalculated ? 'primary' : undefined"
			>
				Calculate
				<v-tooltip activator="parent" location="top">
					Calculate based on currently selected winners
				</v-tooltip>
			</v-btn>
		</th>
	</tr>
	<tr>
		<th class="text-center font-weight-bold border-e cursor-help text-no-wrap" :colspan="2">
			Week Importance
			<v-tooltip activator="parent" location="top">
				Percentage of winning outcomes needing this game
			</v-tooltip>
		</th>
		<th
			v-for="(game, index) in gamesStore.gameData"
			class="text-center border-e"
			:class="[game.state == 'finished' ? 'dimmed' : '', getWeekImportanceColor(index)]"
		>
			{{
				game.state == 'finished'
					? '-'
					: round(weekOutcomesStore.gamesImportanceScores[index], 2)
			}}
		</th>
		<th :colspan="numHeadersNeeded" class="px-1"></th>
	</tr>
	<tr ref="headerRow">
		<th class="text-center font-weight-bold border-e text-no-wrap" :colspan="2">
			nfelo chance
		</th>
		<template v-if="nfeloChancesExist">
			<th
				v-for="(game, index) in gamesStore.gameData"
				class="text-center border-e"
				:class="[game.state == 'finished' ? 'dimmed' : '']"
			>
				{{ getNfeloWinChance(index) }}
			</th>
			<th :colspan="numHeadersNeeded" class="px-1">
				Mean: {{ round(getNfeloWinChanceMean(), 3) }}%
			</th>
		</template>

		<th v-else :colspan="numHeadersNeeded" class="px-1">
			Paste nfelo data to see nfelo chances
		</th>
	</tr>
	<tr>
		<th class="text-center font-weight-bold border-e text-no-wrap" :colspan="2">
			ESPN Win Prob
		</th>
		<th
			v-for="(game, index) in gamesStore.gameData"
			class="text-center border-e"
			:class="[gamesStore.gameData[index].state == 'finished' ? 'dimmed' : '']"
		>
			{{ getEspnWinProb(index) }}
		</th>
		<th :colspan="numHeadersNeeded" class="px-1">
			<div class="d-flex justify-space-between">
				<span class="my-auto"> Mean: {{ round(getEspnWinProbMean(), 3) }}% </span>
				<div>
					<v-tooltip text="Fetch espn win probabilities" location="bottom">
						<template v-slot:activator="{ props }">
							<v-btn
								v-bind="props"
								class="mr-1"
								:rounded="0"
								density="compact"
								@click="espnAnalyticsStore.getEspnWinChances"
								:color="
									espnAnalyticsStore.missingUpcomingWinProbabilities
										? 'primary'
										: undefined
								"
								icon="mdi-refresh"
							/>
						</template>
					</v-tooltip>
				</div>
			</div>
		</th>
	</tr>
</template>

<style scoped>
th {
	font-size: 0.85rem !important;
	/* 11.76px */
	height: 2.5rem !important;
	/* 35.2833px */
}
</style>

<style>
.hide-spin-buttons .v-number-input__control {
	display: none !important;
}

.small-input .v-field__input {
	padding: 0 !important;
	text-align: center !important;
	font-size: 0.85rem !important;
	min-height: 2.4rem !important;
}
</style>
