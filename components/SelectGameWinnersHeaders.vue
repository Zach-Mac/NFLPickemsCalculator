<script setup lang="ts">
const gamesStore = useGamesStore()
const picksStore = usePicksStore()
const nfeloStore = useNfeloStore()
const { smAndDown, mdAndDown } = useDisplay()

const teamButtonSize = computed(() => (mdAndDown.value ? 'x-small' : 'small'))
const iconButtonSize = computed(() => (smAndDown.value ? 'small' : 'default'))

function playerPickedTeam(teamName: string) {
	return picksStore.user ? picksStore.user.picks.includes(teamName) : false
}
const getButtonColor = (teamName: string) => (playerPickedTeam(teamName) ? 'success' : 'error')
const getBaseButtonColor = (teamName: string) => (playerPickedTeam(teamName) ? 'accent' : '')

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

function setUnfinishedToPlayerPicks() {
	gamesStore.gameData.forEach(game => {
		if (game.state != 'finished') {
			if (!picksStore.user) return

			if (picksStore.user.picks.includes(game.home)) game.winner = game.home
			else if (picksStore.user.picks.includes(game.away)) game.winner = game.away
			else game.winner = ''
		}
	})
}

const lockFinishedGames = ref(false)

const disableButton = (game: Game) => lockFinishedGames.value && game.state == 'finished'

const espnWinProbabilities = computed(() => {
	return gamesStore.gameData.map(game => {
		const userPickedHome = picksStore.user.picks.includes(game.home)

		const winProb = userPickedHome
			? game.espnSituation?.lastPlay.probability.homeWinPercentage
			: game.espnSituation?.lastPlay.probability.awayWinPercentage

		return winProb ? winProb * 100 : null
	})
})
const espnWinProbMean = computed(() => {
	let numNull = 0
	const total = espnWinProbabilities.value.reduce((acc, prob) => {
		if (prob === null) {
			numNull++
			return acc
		}
		return acc || 0 + prob
	}, 0)

	if (!total) return 0

	return total / (espnWinProbabilities.value.length - numNull)
})
</script>

<template>
	<tr>
		<th class="text-center font-weight-bold border-e" :colspan="2">nfelo chance</th>
		<th
			v-for="(game, index) in gamesStore.gameData"
			class="text-center border-e"
			:class="[game.state == 'finished' ? 'dimmed' : '']"
		>
			{{ getNfeloWinChance(index) }}
		</th>
		<th colspan="3" class="px-1">Mean: {{ round(getNfeloWinChanceMean(), 3) }}%</th>
	</tr>

	<!-- <tr>
		<th class="text-center font-weight-bold border-e" :colspan="2">Manual game edit</th>
		<th
			v-for="game in gamesStore.gameData"
			class="text-center border-e"
			:class="[game.state == 'finished' ? 'dimmed' : '']"
		>
			<v-btn
				@click=""
				icon="mdi-pencil"
				block
				variant="text"
				rounded="0"
				:size="teamButtonSize"
			></v-btn>
		</th>
		<th colspan="3" class="px-1"></th>
	</tr> -->
	<tr>
		<th class="text-center font-weight-bold border-e" :colspan="2">ESPN Win Probability</th>
		<th
			v-for="(prob, i) in espnWinProbabilities"
			class="text-center border-e"
			:class="[gamesStore.gameData[i].state == 'finished' ? 'dimmed' : '']"
		>
			{{ prob ? round(prob, 4) + '%' : '' }}
		</th>
		<th colspan="3" class="px-1">Mean: {{ round(espnWinProbMean, 3) }}%</th>
	</tr>

	<tr class="font-weight-bold">
		<th colspan="2" class="text-center font-weight-bold border-e">
			<v-btn @click="gamesStore.loadEspnScoreboard" :loading="gamesStore.apiLoading">
				Refresh
			</v-btn>
		</th>
		<th
			v-for="game in gamesStore.gameData"
			class="text-center border-e"
			:class="[game.state == 'finished' ? 'dimmed' : '']"
		>
			<v-btn-toggle
				class="vertical w-100"
				v-model="game.winner"
				density="compact"
				variant="flat"
			>
				<v-btn
					:size="teamButtonSize"
					variant="flat"
					class="font-weight-bold"
					:value="game.home"
					:baseColor="getBaseButtonColor(game.home)"
					:color="getButtonColor(game.home)"
					:disabled="disableButton(game)"
				>
					{{ game.home }}
				</v-btn>
				<v-btn
					:size="teamButtonSize"
					variant="flat"
					class="font-weight-bold"
					:value="game.away"
					:baseColor="getBaseButtonColor(game.away)"
					:color="getButtonColor(game.away)"
					:disabled="disableButton(game)"
				>
					{{ game.away }}
				</v-btn>
			</v-btn-toggle>
		</th>
		<th colspan="3">
			<div class="d-flex justify-space-evenly">
				<v-tooltip text="Ideal rest of week" location="bottom">
					<template v-slot:activator="{ props }">
						<v-btn
							:size="iconButtonSize"
							v-bind="props"
							icon="mdi-bullseye-arrow"
							@click="setUnfinishedToPlayerPicks"
						>
						</v-btn>
					</template>
				</v-tooltip>
				<v-tooltip text="Lock finished games" location="bottom">
					<template v-slot:activator="{ props }">
						<ToggleButton
							v-bind="props"
							class="ml-1"
							:size="iconButtonSize"
							v-model="lockFinishedGames"
							iconToggled="mdi-lock"
							iconUntoggled="mdi-lock-open"
						/>
					</template>
				</v-tooltip>
				<!-- <v-menu>
					<template v-slot:activator="{ props }">
						<v-btn
							v-bind="props"
							:size="iconButtonSize"
							v-model="lockFinishedGames"
							icon="mdi-cog-outline"
							class="ml-1"
						/>
					</template>
					<v-list>
						<v-list-item>
							<v-list-item-title>
								<v-checkbox
									label="Highlight tied rows"
									v-model="highlightTiedRows"
									hide-details
								></v-checkbox>
							</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-menu> -->
			</div>
		</th>
	</tr>
</template>

<style scoped>
.v-btn-toggle.vertical {
	flex-direction: column;
	height: auto !important;
}
.v-btn-toggle.vertical .v-btn {
	height: 36px !important;
	border-radius: 0;
	border-color: inherit;
	border-start-start-radius: 0;
	border-start-end-radius: 0;
	border-end-start-radius: 0;
	border-end-end-radius: 0;
}
</style>
