const blankPositionStats = {
	numWinningOutcomes: 0,
	winningOutcomesPercent: 0,
	nfeloChance: 0,
	espnChance: 0
}

// TODO: stats output too big for many games

function mapBoolToTeamNames(
	gameData: Game[],
	ignoredGamesIndexes: number[],
	boolWeekOutcome: boolean[]
): string[] {
	let j = 0

	return gameData.map((game, i) => {
		if (ignoredGamesIndexes.includes(i)) return game.winner
		return boolWeekOutcome[j++] ? game.home : game.away
	})
}

function getUserOutcomesForAllUsers(
	picksData: any[],
	ignoredGamesIndexes: number[],
	nfeloTeamsWinChances: Record<string, number>,
	espnTeamsWinChances: Record<string, number>,
	weekOutcome: string[]
): Record<string, UserOutcome> {
	const userOutcomes: Record<string, UserOutcome> = {}

	const { playerRankings, topScore, numTiedForFirst, numPlayersAtEachScore } =
		getUserOutcomeInputData(picksData, weekOutcome)

	// Calculate outcomes for each player
	picksData.forEach(player => {
		userOutcomes[player.name] = getUserOutcome(
			ignoredGamesIndexes,
			player,
			weekOutcome,
			playerRankings,
			topScore,
			numTiedForFirst,
			numPlayersAtEachScore,
			nfeloTeamsWinChances,
			espnTeamsWinChances
		)
	})

	return userOutcomes
}

export function getAllUsersStats(
	picksData: any[],
	ignoredGamesIndexes: number[],
	gameData: Game[],
	nfeloTeamsWinChances: Record<string, number>,
	espnTeamsWinChances: Record<string, number>
): UserStats {
	const numGames = gameData.length - ignoredGamesIndexes.length

	let startTime = performance.now()
	const totalOutcomes = Math.pow(2, numGames)

	const stats: UserStats = {
		firstPlace: {},
		top2: {}
	}

	// Process all possible outcomes
	for (let i = 0; i < totalOutcomes; i++) {
		if (i % 10000 === 0) {
			console.log(`${i} of ${totalOutcomes} (${((i / totalOutcomes) * 100).toFixed(2)}%)`)
		}

		const binaryStr = i.toString(2).padStart(numGames, '0')
		const boolWeekOutcome = binaryStr.split('').map(bit => bit === '1')
		const weekOutcome = mapBoolToTeamNames(gameData, ignoredGamesIndexes, boolWeekOutcome)
		const userOutcomes = getUserOutcomesForAllUsers(
			picksData,
			ignoredGamesIndexes,
			nfeloTeamsWinChances,
			espnTeamsWinChances,
			weekOutcome
		)

		for (const [name, userOutcome] of Object.entries(userOutcomes)) {
			if (!stats.firstPlace[name]) {
				stats.firstPlace[name] = { ...blankPositionStats }
				stats.top2[name] = { ...blankPositionStats }
			}

			if (userOutcome.contenderForFirst) {
				stats.firstPlace[name].numWinningOutcomes++
				stats.firstPlace[name].nfeloChance += userOutcome.nfeloChance
				stats.firstPlace[name].espnChance += userOutcome.espnChance
			}
			if (userOutcome.contenderForTop2) {
				stats.top2[name].numWinningOutcomes++
				stats.top2[name].nfeloChance += userOutcome.nfeloChance
				stats.top2[name].espnChance += userOutcome.espnChance
			}
		}
	}

	for (const name of Object.keys(stats.firstPlace)) {
		stats.firstPlace[name].winningOutcomesPercent =
			(stats.firstPlace[name].numWinningOutcomes / totalOutcomes) * 100
		stats.top2[name].winningOutcomesPercent =
			(stats.top2[name].numWinningOutcomes / totalOutcomes) * 100
	}

	const endTime = performance.now()
	console.log('Week outcomes calculator time:', endTime - startTime, 'ms')

	return stats
}
