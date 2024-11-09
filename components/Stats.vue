<script setup lang="ts">
const gamesStore = useGamesStore()
const weekOutcomesStore = useWeekOutcomeStore()
const { winningOutcomes } = storeToRefs(weekOutcomesStore)

const itemsPerPage = 5
const page = ref(1)
const tab = ref(winningOutcomes.value.length - 1)

watch(winningOutcomes, () => {
	tab.value = winningOutcomes.value.length - 1
})
watch(tab, () => {
	page.value = 1
})

const startIndex = computed(() => (page.value - 1) * itemsPerPage)
const endIndex = computed(() => page.value * itemsPerPage)

const panel = ref(0)

const checkboxLabel = 'Consider outcome with possible 2nd place finish as winning'
const checkboxColMinWidth = checkboxLabel.length / 3 + 'em'
</script>

<template>
	<v-row>
		<v-col cols="auto">
			<h1>Stats</h1>
		</v-col>
		<v-col cols="auto">
			<v-btn-toggle
				v-model="weekOutcomesStore.filterGames"
				variant="outlined"
				divided
				mandatory
			>
				<v-btn :value="GAME_FILTERS.ALL">All Games</v-btn>
				<v-btn :value="GAME_FILTERS.UNFINISHED">Unfinished Only</v-btn>
				<v-btn :value="GAME_FILTERS.NOTSTARTED">Not started Only</v-btn>
			</v-btn-toggle>
		</v-col>
		<v-col :style="`min-width: ${checkboxColMinWidth}`">
			<v-checkbox
				v-model="weekOutcomesStore.secondPlaceIsWinning"
				density="comfortable"
				hide-details
			>
				<template v-slot:label>
					<span style="word-break: keep-all">
						Consider outcome with possible 2nd place finish as winning
					</span>
				</template>
			</v-checkbox>
		</v-col>
	</v-row>
	<v-row>
		<v-col cols="auto" class="text-no-wrap">
			<h2>Outcomes</h2>
			<p>
				# Winning / # Total
				<br />
				<b>
					{{ weekOutcomesStore.numWinningOutcomes }} /
					{{ weekOutcomesStore.numPossibleOutcomes }}
				</b>
				<br />
				<b>
					{{
						round(
							(weekOutcomesStore.numWinningOutcomes /
								weekOutcomesStore.numPossibleOutcomes) *
								100,
							2
						)
					}}%
				</b>
			</p>
		</v-col>
		<v-col cols="auto" class="text-no-wrap">
			<h2>nfelo Chance</h2>
			<p>{{ round(weekOutcomesStore.nfeloWinChance, 2) }}%</p>
		</v-col>
		<v-col v-if="weekOutcomesStore.numWinningOutcomes > 0" cols="auto" class="">
			<h2>Must Wins</h2>
			<p>
				<template v-if="weekOutcomesStore.mustWins.length">
					<b
						class="cursor-pointer"
						@click="gamesStore.setCertainGameWinners(weekOutcomesStore.mustWins)"
					>
						<span
							v-for="(team, i) in weekOutcomesStore.mustWins"
							:class="
								gamesStore.teamWon(team)
									? 'text-success-darken-1'
									: gamesStore.teamLost(team)
									? 'text-error'
									: ''
							"
						>
							{{ team + (i == weekOutcomesStore.mustWins.length - 1 ? '' : ', ') }}
						</span>
					</b>
					<br />
					<template v-if="weekOutcomesStore.mustWinsWinChance">
						Chance: {{ round(weekOutcomesStore.mustWinsWinChance, 2) }}%
					</template>
				</template>
				<template v-else> None </template>
			</p>
		</v-col>

		<v-col>
			<v-expansion-panels v-model="panel">
				<v-expansion-panel>
					<v-expansion-panel-title>
						<h2>Winning Outcomes</h2>
					</v-expansion-panel-title>
					<v-expansion-panel-text>
						<template v-if="winningOutcomes.flat().length">
							<h3># of missed wins:</h3>
							<v-tabs v-model="tab">
								<v-tab
									v-for="(outcome, i) in winningOutcomes"
									:key="i"
									:disabled="!outcome.length"
									slim
								>
									{{ i }} ({{ outcome.length }})
								</v-tab>
							</v-tabs>
							<v-tabs-window v-model="tab">
								<v-tabs-window-item
									v-for="(outcomes, i) in winningOutcomes"
									:key="i"
								>
									<div class="d-flex flex-wrap">
										<v-card
											v-for="outcome in outcomes.slice(startIndex, endIndex)"
											@click="
												gamesStore.setAllGameWinners(outcome.weekOutcome)
											"
											class="ma-1"
											hover
										>
											<v-card-text>
												Number wrong:
												<b>
													{{ outcome.userOutcome.missedWins.length }}
												</b>
												<br />
												Missed wins:
												<br />
												<b>
													{{ outcome.userOutcome.missedWins.join(', ') }}
												</b>
												<br />
												Tied with
												<b>
													{{ outcome.userOutcome.tiedWith }}
												</b>
												others
												<br />
												Chance:
												{{ round(outcome.userOutcome.nfeloChance, 5) }}%
											</v-card-text>
										</v-card>
									</div>
									<v-pagination
										v-model="page"
										:length="Math.ceil(outcomes.length / itemsPerPage)"
									></v-pagination>
								</v-tabs-window-item>
							</v-tabs-window>
						</template>
						<template v-else>
							<p>No winning outcomes</p>
						</template>
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
		</v-col>
	</v-row>
</template>
