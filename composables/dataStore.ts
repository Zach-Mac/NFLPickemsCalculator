export const gameData = ref([] as Game[])
export const picksData = ref([] as PlayerPicks[])
// export const filterGames = ref(GAME_FILTERS.ALL)
// export const filterGames = ref(undefined)
export const playerTotals = computed(() => {
	const totals: Record<string, { weekTotal: number; seasonTotal: number }> = {}

	picksData.value.forEach(player => {
		if (!totals[player.name])
			totals[player.name] = { weekTotal: 0, seasonTotal: player.originalSeasonTotal }

		player.picks.forEach((pick, i) => {
			if (pick == gameData.value[i].winner) totals[player.name].weekTotal++
		})

		totals[player.name].seasonTotal += totals[player.name].weekTotal
	})

	return totals
})

export function setGameWinners(weekOutcome: string[]) {
	gameData.value.forEach((game, i) => {
		game.winner = weekOutcome[i]
	})
}
export function setCertainGameWinners(teamNames: string[]) {
	gameData.value.forEach(game => {
		if (teamNames.includes(game.home)) game.winner = game.home
		else if (teamNames.includes(game.away)) game.winner = game.away
		else game.winner = ''
	})
}
export function teamWon(team: string) {
	return gameData.value.filter(game => game.winner == team).length > 0
}
export function teamLost(team: string) {
	const game = getGameWithTeam(team)
	return game?.winner != team && game?.state != 'upcoming'
}
export function getGameWithTeam(team: string) {
	return gameData.value.find(game => game.home == team || game.away == team)
}
