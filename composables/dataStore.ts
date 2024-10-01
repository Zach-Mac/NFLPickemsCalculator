export const gameData = ref([] as Game[])
export const playerPicksInput = ref([] as PlayerPicks[])
export const playerTotals = computed(() => {
	const totals: Record<string, { weekTotal: number; seasonTotal: number }> = {}

	playerPicksInput.value.forEach(player => {
		if (!totals[player.name])
			totals[player.name] = { weekTotal: 0, seasonTotal: player.originalSeasonTotal }

		player.picks.forEach((pick, i) => {
			if (pick == gameData.value[i].winner) totals[player.name].weekTotal++
		})

		totals[player.name].seasonTotal += totals[player.name].weekTotal
	})

	return totals
})
