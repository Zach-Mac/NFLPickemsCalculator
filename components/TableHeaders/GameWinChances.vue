<script setup lang="ts">
const picksStore = usePicksStore()
const gamesStore = useGamesStore()
const nfeloStore = useNfeloStore()
const weekOutcomesStore = useWeekOutcomeStore()

const getNfeloWinChance = (gameIndex: number) => {
	if (!picksStore.user) return 0

	return nfeloStore.nfeloTeamsWinChance[picksStore.user.picks[gameIndex]] + '%'
}
const getNfeloWinChanceMean = () => {
	if (!picksStore.user) return 0

	const total = picksStore.user.picks.reduce((acc, pick) => {
		return acc + nfeloStore.nfeloTeamsWinChance[pick]
	}, 0)

	return total / picksStore.user.picks.length
}

const espnWinProbabilities = computed(() => {
	return gamesStore.gameData.map(game => {
		const userPickedHome = picksStore.user.picks.includes(game.home)

		const probability = game.espn.situation?.lastPlay.probability
		if (!probability) return null

		const winProb = userPickedHome
			? probability.homeWinPercentage
			: probability.awayWinPercentage

		return winProb ? winProb * 100 : null
	})
})
const espnWinProbMean = computed(() => {
	let numNull = 0
	const total = espnWinProbabilities.value.reduce((acc, prob) => {
		if (prob === null) {
			numNull++
			return acc || 0
		}
		return (acc || 0) + prob
	}, 0)

	if (!total) return 0

	return total / (espnWinProbabilities.value.length - numNull)
})

function getImportanceColor(index: number) {
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

const nfeloChancesExist = computed(() => {
	return nfeloStore.nfeloTeamsWinChance && Object.keys(nfeloStore.nfeloTeamsWinChance).length > 0
})

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
			{{ picksStore.userGameEvRanges[index] }}
		</th>
		<th :colspan="numHeadersNeeded" class="px-1">
			<v-btn
				@click="picksStore.calcUserGameEvRanges"
				density="compact"
				slim
				:loading="picksStore.gameEvRangesLoading"
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
			:class="[game.state == 'finished' ? 'dimmed' : '', getImportanceColor(index)]"
		>
			{{ round(weekOutcomesStore.gamesImportanceScores[index], 2) }}
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
			v-for="(prob, i) in espnWinProbabilities"
			class="text-center border-e"
			:class="[gamesStore.gameData[i].state == 'finished' ? 'dimmed' : '']"
		>
			{{ prob ? round(prob, 4) + '%' : '' }}
		</th>
		<th :colspan="numHeadersNeeded" class="px-1">Mean: {{ round(espnWinProbMean, 3) }}%</th>
	</tr>
</template>

<style scoped>
th {
	font-size: 1.2em !important;
	height: 3em !important;
}
</style>
