<script setup lang="ts">
const gamesStore = useGamesStore()
const picksStore = usePicksStore()
const nfeloStore = useNfeloStore()

const { smAndDown } = useDisplay()
const pasteText = computed(() => (smAndDown.value ? 'Paste' : 'Paste'))

async function paste() {
	try {
		picksStore.picksTablePasteInput = await navigator.clipboard.readText()
	} catch (err) {
		console.error('Failed to read clipboard contents: ', err)
	}
}
</script>

<template>
	<v-row align="center">
		<v-col cols="12" md="5" lg="4">
			<v-row>
				<v-col cols="auto" class="px-1 px-md-1">
					<v-combobox
						v-model="gamesStore.selectedWeek"
						:items="[...Array(18).keys()].map(i => i + 1)"
						label="Week"
						type="number"
						min-width="9rem"
						placeholder="auto"
						persistent-placeholder
						hideDetails
					></v-combobox>
				</v-col>
				<v-col cols="auto" class="px-1 px-md-1">
					<v-btn
						@click="gamesStore.loadEspnScoreboard"
						:size="'large'"
						:slim="smAndDown"
						:color="!gamesStore.gameData.length ? 'primary' : undefined"
						:loading="gamesStore.apiLoading"
					>
						Load ESPN
					</v-btn>
				</v-col>
				<v-col class="px-1 px-md-1">
					<v-text-field hideDetails v-model="picksStore.playerName" label="Player name" />
				</v-col>
			</v-row>
		</v-col>
		<v-col cols="12" md="7" lg="8">
			<v-row>
				<v-col class="px-1 px-md-1">
					<v-expansion-panels>
						<v-expansion-panel
							:color="picksStore.picksDataValidated ? undefined : 'error-lighten-3'"
						>
							<v-expansion-panel-title>
								<template v-if="!picksStore.picksDataValidated" v-slot:actions>
									<v-icon color="error" icon="mdi-alert-circle"> </v-icon>
								</template>
								<h3>Poolhost Table</h3>
							</v-expansion-panel-title>
							<v-expansion-panel-text>
								<v-banner
									v-if="!picksStore.picksDataValidated"
									color="error"
									icon="mdi-alert-circle"
								>
									<v-banner-text class="pe-3">
										Picks paste doesn't match ESPN data
									</v-banner-text>
								</v-banner>
								<div class="d-flex">
									<v-btn
										class="align-self-center me-1"
										:size="'large'"
										@click="paste"
										:slim="smAndDown"
									>
										{{ pasteText }}
									</v-btn>
									<v-textarea
										rows="10"
										hideDetails
										label="Paste Poolhost table html"
										v-model="picksStore.picksTablePasteInput"
									></v-textarea>
								</div>
							</v-expansion-panel-text>
						</v-expansion-panel>
					</v-expansion-panels>
				</v-col>
				<v-col cols="12" sm="6" class="px-1 px-md-1">
					<v-expansion-panels>
						<v-expansion-panel
							max-height="700"
							:color="nfeloStore.nfeloGamesValidated ? undefined : 'error-lighten-3'"
						>
							<v-expansion-panel-title>
								<template v-if="!nfeloStore.nfeloGamesValidated" v-slot:actions>
									<v-icon color="error" icon="mdi-alert-circle"> </v-icon>
								</template>
								<h3>nfelo Paste</h3>
							</v-expansion-panel-title>
							<v-expansion-panel-text>
								<v-banner
									v-if="!nfeloStore.nfeloGamesValidated"
									color="error"
									icon="mdi-alert-circle"
								>
									<v-banner-text class="pe-3">
										nfelo paste doesn't match either the ESPN or Poolhost data
									</v-banner-text>
								</v-banner>
								<v-textarea
									hideDetails
									label="Paste nfelo game data"
									v-model="nfeloStore.nfeloGamesInput"
									:rules="[() => nfeloStore.nfeloGamesValidated]"
								></v-textarea>

								<v-expansion-panels>
									<v-expansion-panel>
										<v-expansion-panel-title>
											<h4>Internal data</h4>
										</v-expansion-panel-title>
										<v-expansion-panel-text>
											<v-row class="ga-3" no-gutters>
												<template v-for="game in nfeloStore.nfeloGames">
													<ObjectCard v-if="game" :obj="game" />
												</template>
											</v-row>
										</v-expansion-panel-text>
									</v-expansion-panel>
								</v-expansion-panels>
							</v-expansion-panel-text>
						</v-expansion-panel>
					</v-expansion-panels>
				</v-col>
			</v-row>
		</v-col>
	</v-row>
</template>
