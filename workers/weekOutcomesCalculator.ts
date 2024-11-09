interface PlayerRanking {
	name: string
	score: number
	tieBreaker: number
}

function generateSimilarBoolOutcomes(boolWeekOutcome: boolean[]): boolean[][] {
	const similarOutcomes: boolean[][] = []
	for (let i = 0; i < boolWeekOutcome.length; i++) {
		const copy = boolWeekOutcome.slice()
		if (copy[i]) {
			copy[i] = false
			similarOutcomes.push(copy)
		}
	}
	return similarOutcomes
}

export function getAllUsersStats(
	picksData: any[],
	ignoredGames: number[],
	gameData: Game[],
	nfeloTeamsWinChance: Record<string, number>
) {
	// TODO: stats output too big for many games

	const ignoredGamesIndexes = ignoredGames

	// TODO: doesn't really work
	// If all players picked the same team for a game, ignore that game
	// for (let i = 0; i < gameData.length; i++) {
	// 	if (ignoredGamesIndexes.includes(i)) continue
	// 	const firstPick = picksData[0].picks[i]
	// 	const allSamePick = picksData.every(player => player.picks[i] === firstPick)
	// 	if (allSamePick) {
	// 		ignoredGamesIndexes.push(i)
	// 	}
	// }

	// if (ignoredGamesIndexes.length > 5) {
	// 	ignoredGamesIndexes.push(0)
	// 	ignoredGamesIndexes.push(1)
	// 	ignoredGamesIndexes.push(2)
	// 	ignoredGamesIndexes.push(3)
	// 	ignoredGamesIndexes.push(4)
	// }

	const numGames = gameData.length - ignoredGamesIndexes.length
	console.log('numGames', numGames)

	function convertBoolWeekOutcomeToTeamNames(boolWeekOutcome: boolean[]): string[] {
		let j = 0

		return gameData.map((game, i) => {
			if (ignoredGamesIndexes.includes(i)) return game.winner
			return boolWeekOutcome[j++] ? game.home : game.away
		})
	}

	function getUserOutcome(
		player: PlayerPicks,
		weekOutcome: string[],
		playerRankings: PlayerRanking[],
		topScore: number,
		numTiedForFirst: number,
		numPlayersAtEachScore: Record<number, number>
	): UserOutcome {
		const playerRanking = playerRankings.find(p => p.name === player.name)!

		// Calculate position by counting number of players with higher scores
		const position = playerRankings.filter(p => p.score > playerRanking.score).length + 1

		const contenderForFirst = position === 1
		const contenderForSecond = position === 2 && numTiedForFirst === 1

		const tiedWith = numPlayersAtEachScore[playerRanking.score] - 1
		const pointsAwayFromTopScore = topScore - playerRanking.score

		// Calculate missed wins
		const missedWins = weekOutcome
			.map((team, i) => (team !== player.picks[i] ? team : ''))
			.filter(Boolean)

		// Calculate nfelo chance
		let nfeloChance = 100
		for (let i = 0; i < weekOutcome.length; i++) {
			if (!ignoredGamesIndexes.includes(i)) {
				nfeloChance *= nfeloTeamsWinChance[weekOutcome[i]] / 100
			}
		}

		return {
			contenderForFirst,
			contenderForSecond,
			position,
			numTiedForFirst,
			tiedWith,
			pointsAwayFromTopScore,
			missedWins,
			nfeloChance
		}
	}

	function getUserOutcomesForAllUsers(weekOutcome: string[]): Record<string, UserOutcome> {
		const userOutcomes: Record<string, UserOutcome> = {}
		const playerRankings: PlayerRanking[] = []

		// Calculate scores and create rankings
		picksData.forEach(player => {
			let score = 0
			for (let i = 0; i < player.picks.length; i++) {
				if (player.picks[i] === weekOutcome[i]) score++
			}

			const ranking = {
				name: player.name,
				score,
				tieBreaker: player.tieBreaker
			}
			const insertIndex = findInsertionIndex(playerRankings, ranking)
			playerRankings.splice(insertIndex, 0, ranking)
		})

		// Calculate number of players at each score
		const numPlayersAtEachScore: Record<number, number> = {}
		playerRankings.forEach(player => {
			numPlayersAtEachScore[player.score] = (numPlayersAtEachScore[player.score] || 0) + 1
		})

		const topScore = playerRankings[0].score
		const numTiedForFirst = numPlayersAtEachScore[topScore]

		// Calculate outcomes for each player
		picksData.forEach(player => {
			userOutcomes[player.name] = getUserOutcome(
				player,
				weekOutcome,
				playerRankings,
				topScore,
				numTiedForFirst,
				numPlayersAtEachScore
			)
		})

		return userOutcomes
	}

	const stats: Record<string, UserStats> = {}

	let startTime = performance.now()
	const totalOutcomes = Math.pow(2, numGames)

	// Initialize stats structure
	for (const player of picksData) {
		stats[player.name] = {
			// allOutcomes: [],
			firstPlaceOutcomes: [],
			secondPlaceOutcomes: [],
			firstPlace: {
				nfeloChance: 0,
				numWinningOutcomes: 0,
				winningOutcomesPercentage: 0
			},
			top2: {
				nfeloChance: 0,
				numWinningOutcomes: 0,
				winningOutcomesPercentage: 0
			}
		}
	}

	// Process all possible outcomes
	for (let i = 0; i < totalOutcomes; i++) {
		if (i % 10000 === 0) {
			console.log(`${i} of ${totalOutcomes} (${((i / totalOutcomes) * 100).toFixed(2)}%)`)
		}

		const binaryStr = i.toString(2).padStart(numGames, '0')
		const boolWeekOutcome = binaryStr.split('').map(bit => bit === '1')
		const weekOutcome = convertBoolWeekOutcomeToTeamNames(boolWeekOutcome)
		const userOutcomes = getUserOutcomesForAllUsers(weekOutcome)

		for (const [name, userOutcome] of Object.entries(userOutcomes)) {
			// Ensure arrays exist
			// while (stats[name].firstPlaceOutcomes.length <= userOutcome.missedWins.length) {
			// 	stats[name].firstPlaceOutcomes.push([])
			// 	stats[name].secondPlaceOutcomes.push([])
			// }

			// const outcome = { weekOutcome, userOutcome }

			// Add to appropriate arrays
			if (userOutcome.contenderForFirst) {
				// stats[name].firstPlaceOutcomes[userOutcome.missedWins.length].push(outcome)
				stats[name].firstPlace.nfeloChance += userOutcome.nfeloChance
				stats[name].top2.nfeloChance += userOutcome.nfeloChance
				stats[name].firstPlace.numWinningOutcomes++
			} else if (userOutcome.contenderForSecond) {
				// stats[name].secondPlaceOutcomes[userOutcome.missedWins.length].push(outcome)
				stats[name].top2.nfeloChance += userOutcome.nfeloChance
				stats[name].top2.numWinningOutcomes++
			}
		}
	}

	// Calculate winning outcomes percentage
	for (const [name, userStats] of Object.entries(stats)) {
		userStats.firstPlace.winningOutcomesPercentage =
			(userStats.firstPlace.numWinningOutcomes / totalOutcomes) * 100
		userStats.top2.winningOutcomesPercentage =
			(userStats.top2.numWinningOutcomes / totalOutcomes) * 100
	}

	const endTime = performance.now()
	console.log('Week outcomes calculator time:', endTime - startTime, 'ms')

	// console.log('stats', stats)

	return stats
}

// export function getUserStats(
// 	userName: string,
// 	picksData: any[],
// 	ignoredGames: number[],
// 	gameData: Game[],
// 	nfeloTeamsWinChance: Record<string, number>
// ) {
//     const ignoredGamesIndexes = ignoredGames

// 	function convertBoolWeekOutcomeToTeamNames(boolWeekOutcome: boolean[]): string[] {
// 		let j = 0

// 		return gameData.map((game, i) => {
// 			if (ignoredGamesIndexes.includes(i)) return game.winner
// 			return boolWeekOutcome[j++] ? game.home : game.away
// 		})
// 	}

// 	function getUserOutcome(
// 		player: PlayerPicks,
// 		weekOutcome: string[],
// 		playerRankings: PlayerRanking[],
// 		topScore: number,
// 		numTiedForFirst: number,
// 		numPlayersAtEachScore: Record<number, number>
// 	): UserOutcome {
// 		const playerRanking = playerRankings.find(p => p.name === player.name)!

// 		// Calculate position by counting number of players with higher scores
// 		const position = playerRankings.filter(p => p.score > playerRanking.score).length + 1

// 		const contenderForFirst = position === 1
// 		const contenderForSecond = position === 2 && numTiedForFirst === 1

// 		const tiedWith = numPlayersAtEachScore[playerRanking.score] - 1
// 		const pointsAwayFromTopScore = topScore - playerRanking.score

// 		// Calculate missed wins
// 		const missedWins = weekOutcome
// 			.map((team, i) => (team !== player.picks[i] ? team : ''))
// 			.filter(Boolean)

// 		// Calculate nfelo chance
// 		let nfeloChance = 100
// 		for (let i = 0; i < weekOutcome.length; i++) {
// 			if (!ignoredGamesIndexes.includes(i)) {
// 				nfeloChance *= nfeloTeamsWinChance[weekOutcome[i]] / 100
// 			}
// 		}

// 		return {
// 			contenderForFirst,
// 			contenderForSecond,
// 			position,
// 			numTiedForFirst,
// 			tiedWith,
// 			pointsAwayFromTopScore,
// 			missedWins,
// 			nfeloChance
// 		}
// 	}

// }

function findInsertionIndex(arr: PlayerRanking[], ranking: PlayerRanking): number {
	let low = 0
	let high = arr.length - 1

	while (low <= high) {
		const mid = Math.floor((low + high) / 2)

		// Compare scores first
		if (arr[mid].score === ranking.score) {
			// If scores equal, compare tieBreakers
			if (arr[mid].tieBreaker > ranking.tieBreaker) {
				low = mid + 1
			} else {
				high = mid - 1
			}
		} else if (arr[mid].score < ranking.score) {
			high = mid - 1
		} else {
			low = mid + 1
		}
	}

	return low
}
