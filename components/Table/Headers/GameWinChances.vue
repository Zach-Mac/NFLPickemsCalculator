<script setup lang="ts">
const picksStore = usePicksStore()
const gamesStore = useGamesStore()
const nfeloStore = useNfeloStore()
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
const nfeloChancesExist = computed(() => {
	return nfeloStore.nfeloTeamsWinChance && Object.keys(nfeloStore.nfeloTeamsWinChance).length > 0
})

// espn
const manualEspnWinProbEditMode = ref(false)
const { escape } = useMagicKeys()
watch(escape, () => {
	if (escape.value) manualEspnWinProbEditMode.value = false
})

const espnUserWinProbabilities = ref<(number | undefined)[]>(
	gamesStore.gameData.map(() => undefined)
)
// Getter
watch(
	[() => picksStore.user, () => gamesStore.espnWinProbabilities, () => gamesStore.gameData],
	() => {
		if (!picksStore.user) {
			espnUserWinProbabilities.value = gamesStore.gameData.map(() => undefined)
			return
		}
		espnUserWinProbabilities.value = gamesStore.gameData.map((game, i) => {
			if (!gamesStore.espnWinProbabilities[i]) return undefined

			const pick = picksStore.user?.picks[i]
			if (pick === game.home)
				return round(gamesStore.espnWinProbabilities[i].homeWinPercentage * 100, 1)
			if (pick === game.away)
				return round(gamesStore.espnWinProbabilities[i].awayWinPercentage * 100, 1)
			return undefined
		})
	},
	{ immediate: true, deep: true }
)
// Setter
watch(
	espnUserWinProbabilities,
	newProbs => {
		newProbs.forEach((userWinnerPickProb, i) => {
			if (userWinnerPickProb === undefined) return
			const pick = picksStore.user?.picks[i]
			const game = gamesStore.gameData[i]

			const userLoserPickProb = 100 - userWinnerPickProb

			if (pick === game.home) {
				gamesStore.espnWinProbabilities[i].homeWinPercentage = userWinnerPickProb / 100
				gamesStore.espnWinProbabilities[i].awayWinPercentage = userLoserPickProb / 100
			} else if (pick === game.away) {
				gamesStore.espnWinProbabilities[i].awayWinPercentage = userWinnerPickProb / 100
				gamesStore.espnWinProbabilities[i].homeWinPercentage = userLoserPickProb / 100
			}
		})
	},
	{ deep: true }
)
const espnWinProbMean = computed(() => {
	let numNull = 0
	const total = espnUserWinProbabilities.value.reduce((acc, prob) => {
		if (!prob) {
			numNull++
			return acc || 0
		}
		return (acc || 0) + prob
	}, 0)

	if (!total) return 0

	return total / (espnUserWinProbabilities.value.length - numNull)
})
const manualProbsString = computed({
	get: () => espnUserWinProbabilities.value.map(v => v ?? '').join(' '),
	set: (val: string) => {
		const probs = val.split(' ').map(v => (v ? Number(v) : undefined))
		espnUserWinProbabilities.value = probs
	}
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
			:class="[game.state == 'finished' ? 'dimmed' : '', getWeekImportanceColor(index)]"
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
			v-for="(prob, i) in espnUserWinProbabilities"
			class="text-center border-e"
			:class="[gamesStore.gameData[i].state == 'finished' ? 'dimmed' : '']"
		>
			<template
				v-if="manualEspnWinProbEditMode && gamesStore.gameData[i].state != 'finished'"
			>
				<v-number-input
					class="hide-spin-buttons small-input mx-auto"
					v-model="espnUserWinProbabilities[i]"
					control-variant="stacked"
					density="compact"
					:step="0.1"
					:min="0"
					:max="100"
					hide-spin-buttons
					hide-details
				/>
			</template>
			<template v-else>
				{{ prob !== undefined ? round(prob, 4) + '%' : '' }}
			</template>
		</th>
		<th :colspan="numHeadersNeeded" class="px-1">
			<div class="d-flex justify-space-between">
				<span v-if="!manualEspnWinProbEditMode" class="my-auto">
					Mean: {{ round(espnWinProbMean, 3) }}%
				</span>
				<div>
					<v-tooltip text="Set default espn win probabilities" location="bottom">
						<template v-slot:activator="{ props }">
							<!-- :size="iconButtonSize" -->
							<v-btn
								v-bind="props"
								class="mr-1"
								:rounded="0"
								density="compact"
								@click="manualProbsString = defaultEspnWinProbsString"
								icon="mdi-database-sync"
							/>
						</template>
					</v-tooltip>
					<v-tooltip text="Manually edit win probabilities" location="bottom">
						<template v-slot:activator="{ props }">
							<!-- :size="iconButtonSize" -->
							<ToggleButton
								v-bind="props"
								class="mr-1"
								:rounded="0"
								density="compact"
								v-model="manualEspnWinProbEditMode"
								iconToggled="mdi-pencil"
								iconUntoggled="mdi-pencil"
							/>
						</template>
					</v-tooltip>
				</div>

				<template v-if="manualEspnWinProbEditMode">
					<v-confirm-edit v-model="manualProbsString">
						<template v-slot:default="{ model, actions }">
							<v-card class="w-100">
								<template v-slot:text>
									<v-text-field
										class="small-input mx-auto"
										v-model="model.value"
										density="compact"
										hide-details
									/>
								</template>

								<template v-slot:actions>
									<v-spacer></v-spacer>

									<component :is="actions"></component>
								</template>
							</v-card>
						</template>
					</v-confirm-edit>
				</template>
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
