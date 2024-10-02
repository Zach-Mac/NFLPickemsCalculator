<script setup lang="ts">
const { loadHtmlData, user } = useUserInput()

function playerPickedTeam(teamName: string) {
	return user.value ? user.value.picks.includes(teamName) : false
}
const getButtonColor = (teamName: string) => (playerPickedTeam(teamName) ? 'success' : 'error')
const getBaseButtonColor = (teamName: string) => (playerPickedTeam(teamName) ? 'accent' : '')

function setUnfinishedToPlayerPicks() {
	gameData.value.forEach(game => {
		if (game.state != 'finished') {
			if (!user.value) return

			if (user.value.picks.includes(game.home)) game.winner = game.home
			else if (user.value.picks.includes(game.away)) game.winner = game.away
			else game.winner = 'none'
		}
	})
}

const lockFinishedGames = ref(false)

const disableButton = (game: Game) => lockFinishedGames.value && game.state == 'finished'
</script>

<template>
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
					size="small"
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
					size="small"
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
		<th class="text-center font-weight-bold">
			<v-tooltip text="Ideal rest of week" location="bottom">
				<template v-slot:activator="{ props }">
					<v-btn
						v-bind="props"
						icon="mdi-bullseye-arrow"
						@click="setUnfinishedToPlayerPicks"
					>
					</v-btn>
				</template>
			</v-tooltip>
		</th>
		<th></th>
		<th class="text-center font-weight-bold">
			<v-tooltip text="Lock finished games" location="bottom">
				<template v-slot:activator="{ props }">
					<ToggleButton
						v-bind="props"
						v-model="lockFinishedGames"
						iconToggled="mdi-lock"
						iconUntoggled="mdi-lock-open"
					/>
				</template>
			</v-tooltip>
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
