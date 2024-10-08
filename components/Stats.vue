<script setup lang="ts">
const { winningOutcomes, numWinningOutcomes, numPossibleOutcomes, mustWins } =
	useWeekOutcomeCombinations()

const { filterGames } = useUserInput()

const itemsPerPage = 10
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
			<v-btn-toggle v-model="filterGames" variant="outlined" divided mandatory>
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
		<v-col cols="auto" class="">
			<h2>Must Wins</h2>
			<p>
				<b class="cursor-pointer" @click="setCertainGameWinners(mustWins)">
					<span
						v-for="(team, i) in mustWins"
						:class="
							teamWon(team)
								? 'text-success-darken-1'
								: teamLost(team)
								? 'text-error'
								: ''
						"
					>
						{{ team + (i == mustWins.length - 1 ? '' : ', ') }}
					</span>
				</b>
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
										<!-- <ObjectCard v-for="outcome in importantWinningOutcomes" :obj="outcome" /> -->
										<v-card
											v-for="outcome in outcomes.slice(startIndex, endIndex)"
											@click="setGameWinners(outcome.weekOutcome)"
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
		<!-- </div> -->
	</v-row>
</template>
