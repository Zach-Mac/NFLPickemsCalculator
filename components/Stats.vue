<script setup lang="ts">
const gamesStore = useGamesStore()

const {
	winningOutcomes,
	numWinningOutcomes,
	numPossibleOutcomes,
	mustWins,
	nfeloWinChance,
	mustWinsWinChance
} = useWeekOutcomeCombinations()

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
</script>

<template>
	<v-row>
		<v-col cols="auto">
			<h1>Stats</h1>
		</v-col>
		<v-col>
			<v-btn-toggle v-model="gamesStore.filterGames" variant="outlined" divided mandatory>
				<v-btn :value="GAME_FILTERS.ALL">All Games</v-btn>
				<v-btn :value="GAME_FILTERS.UNFINISHED">Unfinished Only</v-btn>
				<v-btn :value="GAME_FILTERS.NOTSTARTED">Not started Only</v-btn>
			</v-btn-toggle>
		</v-col>
	</v-row>
	<v-row>
		<v-col cols="auto" class="text-no-wrap">
			<h2>Outcomes</h2>
			<p>
				# Winning / # Total
				<br />
				<b> {{ numWinningOutcomes }} / {{ numPossibleOutcomes }} </b>
				<br />
				<b> {{ (numWinningOutcomes / numPossibleOutcomes) * 100 }}% </b>
			</p>
		</v-col>
		<v-col cols="auto" class="text-no-wrap">
			<h2>nfelo Chance</h2>
			<p>{{ round(nfeloWinChance, 5) }}%</p>
		</v-col>
		<v-col v-if="numWinningOutcomes > 0" cols="auto" class="">
			<h2>Must Wins</h2>
			<p>
				<template v-if="mustWins.length">
					<b class="cursor-pointer" @click="gamesStore.setCertainGameWinners(mustWins)">
						<span
							v-for="(team, i) in mustWins"
							:class="
								gamesStore.teamWon(team)
									? 'text-success-darken-1'
									: gamesStore.teamLost(team)
									? 'text-error'
									: ''
							"
						>
							{{ team + (i == mustWins.length - 1 ? '' : ', ') }}
						</span>
					</b>
					<br />
					<template v-if="mustWinsWinChance">
						Chance: {{ round(mustWinsWinChance, 5) }}%
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
							<v-tabs v-model="tab">
								<v-tab
									v-for="(outcome, i) in winningOutcomes"
									:key="i"
									:disabled="!outcome.length"
								>
									{{ i }} Wrong ({{ outcome.length }})
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
