<script setup lang="ts">
const { loadHtmlData, playerName } = useUserInput()

function playerPickedTeam(teamName: string) {
	const player = playerPicksInput.value.find(p => p.name == playerName.value)
	return player ? player.picks.includes(teamName) : false
}
function getButtonColor(teamName: string) {
	const buttonColor = playerPickedTeam(teamName) ? 'success' : 'error'
	return buttonColor
}
function getBaseButtonColor(teamName: string) {
	return playerPickedTeam(teamName) ? 'accent' : ''
}
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
				>
					{{ game.away }}
				</v-btn>
			</v-btn-toggle>
		</th>
		<th></th>
		<th></th>
		<th></th>
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
