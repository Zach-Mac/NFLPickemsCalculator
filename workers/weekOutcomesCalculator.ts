// TODO: stats output too big for many games

function countBits(bits: number) {
	bits = bits - ((bits >>> 1) & 0x55555555)
	bits = (bits & 0x33333333) + ((bits >>> 2) & 0x33333333)
	return Math.imul((bits + (bits >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24
}

function newTally(numPlayers: number) {
	return {
		numWinningOutcomes: new Uint32Array(numPlayers),
		nfeloChance: new Float64Array(numPlayers),
		espnChance: new Float64Array(numPlayers)
	}
}
type Tally = ReturnType<typeof newTally>

function addOutcome(tally: Tally, player: number, nfeloChance: number, espnChance: number) {
	tally.numWinningOutcomes[player]++
	tally.nfeloChance[player] += nfeloChance
	tally.espnChance[player] += espnChance
}

export function getAllUsersStats(
	picksData: any[],
	ignoredGamesIndexes: number[],
	gameData: Game[],
	nfeloTeamsWinChances: Record<string, number>,
	espnTeamsWinChances: Record<string, number>
): UserStats {
	const startTime = performance.now()

	const openGameIndexes = gameData
		.map((_, i) => i)
		.filter(i => !ignoredGamesIndexes.includes(i))
	const totalOutcomes = Math.pow(2, openGameIndexes.length)
	const allOpenGames = totalOutcomes - 1

	const players = picksData.map(player => {
		let pickedHome = 0
		let pickedAway = 0
		openGameIndexes.forEach((gameIndex, bit) => {
			const { home, away } = gameData[gameIndex]
			if (player.picks[gameIndex] === home) pickedHome |= 1 << bit
			else if (player.picks[gameIndex] === away) pickedAway |= 1 << bit
		})
		const ignoredGamesScore = ignoredGamesIndexes.filter(
			i => player.picks[i] === gameData[i].winner
		).length
		return { ignoredGamesScore, pickedHome, pickedAway }
	})

	const winOdds = (teamsWinChances: Record<string, number>) =>
		openGameIndexes.map(i => ({
			home: teamsWinChances[gameData[i].home] / 100,
			away: teamsWinChances[gameData[i].away] / 100
		}))
	const nfeloOdds = winOdds(nfeloTeamsWinChances)
	const espnOdds = winOdds(espnTeamsWinChances)

	const firstPlace = newTally(players.length)
	const top2 = newTally(players.length)
	const scores = new Uint16Array(players.length)

	for (let homeWins = 0; homeWins < totalOutcomes; homeWins++) {
		const awayWins = ~homeWins & allOpenGames

		let nfeloChance = 100
		let espnChance = 100
		for (let bit = 0; bit < openGameIndexes.length; bit++) {
			const homeWon = homeWins & (1 << bit)
			nfeloChance *= homeWon ? nfeloOdds[bit].home : nfeloOdds[bit].away
			espnChance *= homeWon ? espnOdds[bit].home : espnOdds[bit].away
		}

		let topScore = -1
		let numAtTopScore = 0
		let secondScore = -1
		for (let p = 0; p < players.length; p++) {
			const { ignoredGamesScore, pickedHome, pickedAway } = players[p]
			const score =
				ignoredGamesScore +
				countBits(pickedHome & homeWins) +
				countBits(pickedAway & awayWins)
			scores[p] = score

			if (score > topScore) {
				secondScore = topScore
				topScore = score
				numAtTopScore = 1
			} else if (score === topScore) numAtTopScore++
			else if (score > secondScore) secondScore = score
		}

		for (let p = 0; p < players.length; p++) {
			const contenderForFirst = scores[p] === topScore
			const contenderForTop2 =
				contenderForFirst || (numAtTopScore === 1 && scores[p] === secondScore)

			if (contenderForFirst) addOutcome(firstPlace, p, nfeloChance, espnChance)
			if (contenderForTop2) addOutcome(top2, p, nfeloChance, espnChance)
		}
	}

	const toPositionStats = (tally: Tally) =>
		Object.fromEntries(
			picksData.map((player, p) => [
				player.name,
				{
					numWinningOutcomes: tally.numWinningOutcomes[p],
					winningOutcomesPercent: (tally.numWinningOutcomes[p] / totalOutcomes) * 100,
					nfeloChance: tally.nfeloChance[p],
					espnChance: tally.espnChance[p]
				}
			])
		)

	console.log('Week outcomes calculator time:', performance.now() - startTime, 'ms')

	return { firstPlace: toPositionStats(firstPlace), top2: toPositionStats(top2) }
}
