<script setup lang="ts">
const { loadHtmlData, user, highlightTiedRows } = usePoolhostInput()
const { smAndDown, mdAndDown } = useDisplay()

const teamButtonSize = computed(() => (mdAndDown.value ? 'x-small' : 'small'))
const iconButtonSize = computed(() => (smAndDown.value ? 'small' : 'default'))

function playerPickedTeam(teamName: string) {
	return user.value ? user.value.picks.includes(teamName) : false
}
const getButtonColor = (teamName: string) => (playerPickedTeam(teamName) ? 'success' : 'error')
const getBaseButtonColor = (teamName: string) => (playerPickedTeam(teamName) ? 'accent' : '')

const getWinChance = (game: Game) => {
	if (!user.value) return 0

	return user.value.picks.includes(game.home) ? game.homeWinPercent : game.awayWinPercent
}

const getWinChanceMean = () => {
	if (!user.value) return 0

	const total = gameData.value.reduce((acc, game) => {
		if (!game.homeWinPercent || !game.awayWinPercent) return acc
		if (user.value.picks.includes(game.home)) return acc + game.homeWinPercent
		if (user.value.picks.includes(game.away)) return acc + game.awayWinPercent
		return acc
	}, 0)

	return total / user.value.picks.length
}

function setUnfinishedToPlayerPicks() {
	gameData.value.forEach(game => {
		if (game.state != 'finished') {
			if (!user.value) return

			if (user.value.picks.includes(game.home)) game.winner = game.home
			else if (user.value.picks.includes(game.away)) game.winner = game.away
			else game.winner = ''
		}
	})
}

const lockFinishedGames = ref(false)

const disableButton = (game: Game) => lockFinishedGames.value && game.state == 'finished'
</script>

<template>
	<tr>
		<th class="text-center font-weight-bold border-e" :colspan="2">nfelo chance</th>
		<th
			v-for="game in gameData"
			class="text-center border-e"
			:class="[game.state == 'finished' ? 'dimmed' : '']"
		>
			{{ getWinChance(game) }}%
		</th>
		<th colspan="3" class="px-1">Mean: {{ round(getWinChanceMean(), 3) }}%</th>
	</tr>

	<tr class="font-weight-bold">
		<th colspan="2" class="text-center font-weight-bold border-e">
			<v-btn @click="loadHtmlData">Reset</v-btn>
		</th>
		<th
			v-for="game in gameData"
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
