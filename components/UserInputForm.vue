<script setup lang="ts">
const gamesStore = useGamesStore()
const picksStore = usePicksStore()
const nfeloStore = useNfeloStore()

const { smAndDown } = useDisplay()
const pasteText = 'Paste from clipboard'

const maxDialogWidth = computed(() => (smAndDown.value ? '90%' : '50%'))

async function pasteToPicks() {
	try {
		picksStore.picksTablePasteInput = await navigator.clipboard.readText()
	} catch (err) {
		console.error('Failed to read clipboard contents: ', err)
	}
}
async function pasteToNfelo() {
	try {
		nfeloStore.nfeloGamesInput = await navigator.clipboard.readText()
	} catch (err) {
		console.error('Failed to read clipboard contents: ', err)
	}
}

const playerNameInput = ref()
const playerNameRequiredText =
	'Player name is required. Type in input field or click on player name in table to set'
const playerNameRules = [
	(v: string) => {
		if (!picksStore.picksTablePasteInput) return true
		if (!v) return playerNameRequiredText
		if (!picksStore.picksData.find(player => player.name === v))
			return 'Player name not found in picks table'
		return true
	}
]
watch([() => picksStore.picksTablePasteInput, () => picksStore.picksData], () => {
	playerNameInput.value?.validate()
})
const playerNameValid = computed(() => playerNameInput.value?.isValid)

const loadEspnButtonColor = computed(() => {
	if (!gamesStore.gameData.length) return 'primary'
	return undefined
})
const setDefaultPoolhostButtonColor = computed(() => {
	if (!picksStore.picksTablePasteInput) return 'primary'
	return undefined
})
const setDefaultNfeloButtonColor = computed(() => {
	if (!nfeloStore.nfeloGamesInput) return 'primary'
	return undefined
})

function useDefaultPicks() {
	picksStore.picksTablePasteInput = defaultPicksTablePasteInput
}
function useDefaultNfelo() {
	nfeloStore.nfeloGamesInput = defaultNfeloGamesInput
}

const setPicksTableManual = ref(false)
const setNfeloManual = ref(false)
</script>

<template>
	<v-row>
		<v-col cols="12" md="6" lg="5">
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
						:color="loadEspnButtonColor"
						:loading="gamesStore.apiLoading"
					>
						Load ESPN
					</v-btn>
				</v-col>
				<v-col class="px-1 px-md-1">
					<v-text-field
						ref="playerNameInput"
						v-model="picksStore.playerName"
						label="Player name"
						:rules="playerNameRules"
						validate-on="invalid-input eager"
					/>
				</v-col>
			</v-row>
		</v-col>
		<v-col cols="auto" class="px-1 px-md-1">
			<v-card>
				<!-- <table v-html="picksStore.picksTablePasteInput" class="tinyTable"></table> -->
				<h3 class="text-center pa-2">Poolhost table</h3>
				<v-btn
					@click="useDefaultPicks"
					:slim="smAndDown"
					prepend-icon="mdi-table-sync"
					:color="setDefaultPoolhostButtonColor"
					elevation="1"
					class="mr-1"
				>
					Use Default
				</v-btn>
				<v-btn
					@click="setPicksTableManual = true"
					:slim="smAndDown"
					:color="picksStore.picksDataValidated ? undefined : 'error-lighten-3'"
					prepend-icon="mdi-pencil"
					elevation="1"
				>
					Set Manually
					<template v-if="!picksStore.picksDataValidated" v-slot:append>
						<v-icon color="error" icon="mdi-alert-circle"> </v-icon>
					</template>
				</v-btn>
			</v-card>
			<v-dialog v-model="setPicksTableManual" :max-width="maxDialogWidth">
				<v-card>
					<v-card-title class="pa-5 mx-3"> <h3>Poolhost Table</h3> </v-card-title>
					<v-card-text class="pa-5 mx-3 mb-5">
						<v-banner
							v-if="!picksStore.picksDataValidated"
							color="error"
							icon="mdi-alert-circle"
						>
							<v-banner-text class="pe-3">
								Picks paste doesn't match ESPN data
							</v-banner-text>
						</v-banner>
						<v-textarea
							rows="10"
							hideDetails
							label="Paste Poolhost table html"
							v-model="picksStore.picksTablePasteInput"
						/>
						<v-btn
							class="align-self-center me-1"
							:size="'large'"
							@click="pasteToPicks"
							:slim="smAndDown"
						>
							{{ pasteText }}
						</v-btn>
					</v-card-text>
				</v-card>
			</v-dialog>
		</v-col>
		<v-col cols="auto" class="px-1 px-md-1">
			<v-card>
				<h3 class="text-center pa-2">nfelo Data</h3>
				<v-btn
					@click="useDefaultNfelo"
					:slim="smAndDown"
					prepend-icon="mdi-database-sync"
					:color="setDefaultNfeloButtonColor"
					elevation="1"
					class="mr-1"
				>
					Use Default
				</v-btn>
				<v-btn
					@click="setNfeloManual = true"
					:slim="smAndDown"
					:color="nfeloStore.nfeloGamesValidated ? undefined : 'error-lighten-3'"
					prepend-icon="mdi-pencil"
					elevation="1"
				>
					Set Manually
					<template v-if="!nfeloStore.nfeloGamesValidated" v-slot:append>
						<v-icon color="error" icon="mdi-alert-circle"> </v-icon>
					</template>
				</v-btn>
			</v-card>
			<v-dialog v-model="setNfeloManual" :max-width="maxDialogWidth">
				<v-card>
					<v-card-title class="pa-5 mx-3"><h3>nfelo Data</h3> </v-card-title>
					<v-card-text class="pa-5 mx-3 mb-5">
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
						<v-btn
							class="align-self-center me-1"
							:size="'large'"
							@click="pasteToNfelo"
							:slim="smAndDown"
						>
							{{ pasteText }}
						</v-btn>

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
					</v-card-text>
				</v-card>
			</v-dialog>
		</v-col>
	</v-row>
</template>

<style scoped>
.tinyTable {
	font-size: 0.5rem;
}
</style>

<style></style>
