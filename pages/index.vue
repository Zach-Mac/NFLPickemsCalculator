<script setup lang="ts">
const gamesStore = useGamesStore()
const picksStore = usePicksStore()
const nfeloStore = useNfeloStore()

const weekNumText = computed(() =>
	gamesStore.currentWeek != 0 ? gamesStore.currentWeek : 'None'
)

const espnUpdateText = computed(() => {
	if (gamesStore.lastEspnUpdate) {
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric'
		}
		return new Date(gamesStore.lastEspnUpdate).toLocaleString(
			'en-us',
			options
		)
	}
	return 'None'
})

function resetPicksAndNfeloToDefault() {
	picksStore.resetPicksTablePasteWeekInputs()
	nfeloStore.resetNfeloGamesInputs()
}

const tabTexts = computed(() => {
	const texts = []
	for (let i = 1; i <= 18; i++) {
		texts.push(i.toString())
	}
	texts.push('WC', 'DIV', 'CONF', 'SB')
	return texts
})
</script>

<template>
	<v-row>
		<v-col cols="auto">
			<h2>Week</h2>
		</v-col>

		<v-col cols="auto">
			<v-tabs v-model="gamesStore.selectedWeek" density="compact">
				<v-tab class="d-none"></v-tab>
				<v-tab
					v-for="i in 22"
					:key="i"
					@click="gamesStore.selectedWeek = i"
					color="primary-darken-1"
					slim
					min-width="3em"
					variant="flat"
					class="me-1 border-thin"
				>
					{{ tabTexts[i - 1] }}
				</v-tab>
			</v-tabs>
		</v-col>
		<v-col cols="auto">
			<v-btn @click="resetPicksAndNfeloToDefault" variant="elevated">
				Reset All Weeks to Default
			</v-btn>
		</v-col>
	</v-row>
	<UserInputForm />
	<v-row>
		<v-col>
			<template v-if="!picksStore.picksData.length">
				<h1>Stats</h1>
				<h2>Paste poolhost table html to view stats</h2>
			</template>
			<template v-else-if="!gamesStore.gameData.length">
				<h1>Stats</h1>
				<h2>Load ESPN data to view stats</h2>
			</template>
			<template v-else>
				<Stats />
			</template>
		</v-col>
	</v-row>

	<v-divider class="my-3"></v-divider>

	<v-row>
		<v-col>
			<h1>Player Rankings</h1>
			<v-alert
				v-if="!picksStore.picksData.length"
				title="Poolhost Data Missing"
				text="Please paste Poolhost picks data to view player rankings. Ensure the data format is correct. Possible mismatch between espn data and Poolhost picks data."
				type="error"
			/>
			<v-alert
				v-else-if="!picksStore.playerName"
				title="Player Name Missing"
				text="Please click on a player name in the table or type in the input field to set the player name."
				type="warning"
			/>
			<h2 v-if="!gamesStore.gameData.length">
				Load ESPN data to view table
			</h2>
			<template v-else>
				<small>
					Last ESPN update:
					<b>
						{{ espnUpdateText }}
					</b>
				</small>
				<PicksTable class="mb-5" />
				<v-dialog
					v-model="gamesStore.showEditGamesDialog"
					max-width="500"
				>
					<v-card>
						<v-card-title> Edit Game </v-card-title>
						<v-card-text>
							<v-container>
								<v-row>
									<v-col>
										<ObjectCard
											:obj="
												gamesStore.gameData[
													gamesStore.editGameIndex
												]
											"
										/>
										<v-divider class="my-5"></v-divider>

										<EditObjectForm
											v-model="
												gamesStore.gameData[
													gamesStore.editGameIndex
												]
											"
											:options="
												gamesStore.editGameOptions
											"
										/>
									</v-col>
								</v-row>
							</v-container>
						</v-card-text>
					</v-card>
				</v-dialog>
			</template>
		</v-col>
	</v-row>

	<template v-if="gamesStore.gameData.length">
		<v-divider class="my-5"></v-divider>

		<v-expansion-panels>
			<v-expansion-panel>
				<v-expansion-panel-title>
					<h2>Internal Game Data</h2>
				</v-expansion-panel-title>
				<v-expansion-panel-text>
					<v-row class="ga-3" no-gutters>
						<ObjectCard
							v-for="game in gamesStore.gameData"
							:obj="game"
							class="text-no-wrap overflow-x-auto"
							:style="{ maxWidth: '13em' }"
						/>
					</v-row>
				</v-expansion-panel-text>
			</v-expansion-panel>
		</v-expansion-panels>

		Number of games left season + playoffs: {{ picksStore.numGamesLeft }}
	</template>
	<!-- </v-tabs-window-item>
	</v-tabs-window> -->
</template>

<style>
.dimmed {
	position: relative;
}
.dimmed::after {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(var(--v-border-color), var(--v-hover-opacity));
	pointer-events: none;
}

table {
	font-size: 0.8em;
}

td,
th {
	padding-left: 0px !important;
	padding-right: 0px !important;
}
</style>
