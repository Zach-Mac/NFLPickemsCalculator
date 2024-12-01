<script setup lang="ts">
const gamesStore = useGamesStore()
const picksStore = usePicksStore()

const { smAndDown } = useDisplay()

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
	if (!gamesStore.gameData.length || !gamesStore.espnScoreboard) return 'primary'
	return undefined
})
</script>

<template>
	<v-row>
		<v-col cols="12" md="6" lg="5">
			<v-row>
				<v-col cols="auto" class="px-1 px-md-1">
					<v-btn
						@click="gamesStore.reloadScoreboard"
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
		<v-col cols="12" md="6">
			<UploadButtons />
		</v-col>
	</v-row>
</template>

<style scoped>
.tinyTable {
	font-size: 0.5rem;
}
</style>

<style></style>
