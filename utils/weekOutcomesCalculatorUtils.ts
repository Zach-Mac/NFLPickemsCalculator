export async function runAsyncFunctionRaw<T extends (...args: any[]) => any>(
	func: T,
	...args: Parameters<T>
): Promise<ReturnType<T>> {
	const rawArgs = args.map(arg => deepToRaw(arg))
	return await func(...rawArgs)
}
export function runFunctionRaw<T extends (...args: any[]) => any>(
	func: T,
	...args: Parameters<T>
): ReturnType<T> {
	const rawArgs = args.map(arg => deepToRaw(arg))
	return func(...rawArgs)
}

export function getSingleUsersStats(
	username: string,
	picksData: any[],
	ignoredGamesIndexes: number[],
	gameData: Game[],
	idealOutcome: string[],
	worstOutcome: string[],
	nfeloTeamsWinChances: Record<string, number>,
	espnTeamsWinChances: Record<string, number>,
	secondPlaceIsWinning: boolean
): SingleUsersStats {
	const startTime = performance.now()

	const userIndex = picksData.findIndex(player => player.name === username)
	if (userIndex === -1) throw Error(`User "${username}" not found in picks data.`)
	const userPicks: string[] = picksData[userIndex].picks
	const maxPlayersAbove = secondPlaceIsWinning ? 1 : 0

	const openGameIndexes = gameData
		.map((_, i) => i)
		.filter(i => !ignoredGamesIndexes.includes(i))
	const openGameBits = gameData.map((_, i) => openGameIndexes.indexOf(i))
	const totalOutcomes = Math.pow(2, openGameIndexes.length)
	const allOpenGames = totalOutcomes - 1

	const players = picksData.map(player => {
		let pickedUserTeam = 0
		let pickedOtherTeam = 0
		openGameIndexes.forEach((gameIndex, bit) => {
			const pick = player.picks[gameIndex]
			if (pick === idealOutcome[gameIndex]) pickedUserTeam |= 1 << bit
			else if (pick === worstOutcome[gameIndex]) pickedOtherTeam |= 1 << bit
		})
		const ignoredGamesScore = ignoredGamesIndexes.filter(
			i => player.picks[i] === gameData[i].winner
		).length
		return { ignoredGamesScore, pickedUserTeam, pickedOtherTeam }
	})
	const scoreOf = (player: (typeof players)[number], userTeamsWon: number) =>
		player.ignoredGamesScore +
		countBits(player.pickedUserTeam & userTeamsWon) +
		countBits(player.pickedOtherTeam & ~userTeamsWon & allOpenGames)

	const winOdds = (teamsWinChances: Record<string, number>) =>
		openGameIndexes.map(i => ({
			userTeam: teamsWinChances[idealOutcome[i]] / 100,
			otherTeam: teamsWinChances[worstOutcome[i]] / 100
		}))
	const nfeloOdds = winOdds(nfeloTeamsWinChances)
	const espnOdds = winOdds(espnTeamsWinChances)

	const output: SingleUsersStats = {
		numWinningOutcomes: 0,
		winningOutcomesPercent: 0,
		nfeloChance: 0,
		espnChance: 0,
		winningOutcomes: []
	}

	for (let userTeamsWon = 0; userTeamsWon < totalOutcomes; userTeamsWon++) {
		const userScore = scoreOf(players[userIndex], userTeamsWon)
		let playersAbove = 0
		for (let p = 0; p < players.length && playersAbove <= maxPlayersAbove; p++) {
			if (scoreOf(players[p], userTeamsWon) > userScore) playersAbove++
		}
		if (playersAbove > maxPlayersAbove) continue

		const scores = players.map(player => scoreOf(player, userTeamsWon))
		const topScore = Math.max(...scores)

		const weekOutcome = gameData.map((game, i) => {
			const bit = openGameBits[i]
			if (bit === -1) return game.winner ?? ''
			return userTeamsWon & (1 << bit) ? idealOutcome[i] : worstOutcome[i]
		})

		let nfeloChance = 100
		let espnChance = 100
		for (let bit = 0; bit < openGameIndexes.length; bit++) {
			const userTeamWon = userTeamsWon & (1 << bit)
			nfeloChance *= userTeamWon ? nfeloOdds[bit].userTeam : nfeloOdds[bit].otherTeam
			espnChance *= userTeamWon ? espnOdds[bit].userTeam : espnOdds[bit].otherTeam
		}

		const userOutcome: UserOutcome = {
			contenderForFirst: playersAbove === 0,
			contenderForTop2: playersAbove <= 1,
			position: playersAbove + 1,
			numTiedForFirst: scores.filter(score => score === topScore).length,
			tiedWith: scores.filter(score => score === userScore).length - 1,
			pointsAwayFromTopScore: topScore - userScore,
			missedWins: weekOutcome
				.map((team, i) => (team !== userPicks[i] ? team : ''))
				.filter(Boolean),
			nfeloChance,
			espnChance
		}

		const numMissed = userOutcome.missedWins.length
		output.winningOutcomes[numMissed] ??= []
		output.winningOutcomes[numMissed].push({ weekOutcome, userOutcome })

		output.numWinningOutcomes++
		output.nfeloChance += nfeloChance
		output.espnChance += espnChance
	}

	for (let i = 0; i < output.winningOutcomes.length; i++) {
		if (!output.winningOutcomes[i]) output.winningOutcomes[i] = []
		else
			output.winningOutcomes[i].sort(
				(a, b) =>
					a.userOutcome.tiedWith - b.userOutcome.tiedWith ||
					b.userOutcome.nfeloChance - a.userOutcome.nfeloChance
			)
	}

	output.winningOutcomesPercent = (output.numWinningOutcomes / totalOutcomes) * 100

	console.log('Winning outcomes total time:', performance.now() - startTime, 'ms')

	return output
}
