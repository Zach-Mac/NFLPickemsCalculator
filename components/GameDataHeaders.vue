<!-- GameDataHeaders.vue -->

<script setup lang="ts">
const ballPossessionClasses = 'bg-primary-lighten-3 text-black px-1 py-05 border'

function sortTable(sortKey: 'weekTotal' | 'seasonTotal') {
	playerPicksInput.value = [...playerPicksInput.value].sort((a, b) => {
		const totalA = playerTotals.value[a.name][sortKey]
		const totalB = playerTotals.value[b.name][sortKey]
		return totalB - totalA
	})
}
</script>

<template>
	<tr>
		<th class="text-center font-weight-bold w-0 border-e">
			<br /><br /><br /><br /><br />
			Rank
		</th>
		<th class="text-right font-weight-bold w-0 border-e">
			Score:
			<br />
			Home:
			<br />
			Away:
			<br />
			Score:
			<br />
			Status:
			<br />
			<div class="text-center">Player Name</div>
		</th>
		<th
			v-for="game in gameData"
			class="text-center font-weight-bold border-e"
			:class="[game.state == 'finished' ? 'dimmed' : '']"
		>
			{{ game.state != 'upcoming' ? game.scoreHome : '' }}
			<br />
			<span :class="game.teamWithPossession == game.home ? ballPossessionClasses : ''">
				{{ game.home }}
			</span>
			<br />
			<span :class="game.teamWithPossession == game.away ? ballPossessionClasses : ''">
				{{ game.away }}
			</span>
			<br />
			{{ game.state != 'upcoming' ? game.scoreAway : '' }}
			<br />
			{{ game.state == 'finished' ? 'Final' : game.timeLeft }}
			<br />
			{{ game.quarter }}
			<br />
		</th>
		<th
			class="cursor-pointer text-center font-weight-bold pr-1 border-e"
			@click="sortTable('weekTotal')"
		>
			<br /><br /><br /><br /><br />
			Week
		</th>
		<th
			class="cursor-pointer text-center font-weight-bold pr-1 border-e"
			@click="sortTable('seasonTotal')"
		>
			<br /><br /><br /><br /><br />
			Season
		</th>
		<th class="text-center font-weight-bold">
			<br /><br /><br /><br /><br />
			Tie Breaker
		</th>
	</tr>
</template>
