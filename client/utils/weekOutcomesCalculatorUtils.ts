export interface PlayerRanking {
	name: string
	score: number
	tieBreaker: number
}
export function findInsertionIndex(arr: PlayerRanking[], ranking: PlayerRanking): number {
	let low = 0
	let high = arr.length - 1

	while (low <= high) {
		const mid = Math.floor((low + high) / 2)
		if (arr[mid].score === ranking.score) {
			if (arr[mid].tieBreaker > ranking.tieBreaker) low = mid + 1
			else high = mid - 1
		} else if (arr[mid].score < ranking.score) high = mid - 1
		else low = mid + 1
	}
	return low
}
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
	const userOutcomeWinning = (userOutcome: UserOutcome) =>
		userOutcome.contenderForFirst || (secondPlaceIsWinning && userOutcome.contenderForTop2)

	const numGames = gameData.length - ignoredGamesIndexes.length
	console.log('numGames singleuserstats', numGames)

	let startTime, endTime

	startTime = performance.now()

	const userPicks = picksData.find(player => player.name === username)
	if (!userPicks) throw Error(`User "${username}" not found in picks data.`)

	const output: SingleUsersStats = {
		numWinningOutcomes: 0,
		winningOutcomesPercent: 0,
		nfeloChance: 0,
		espnChance: 0,
		nfeloEv: 0,
		espnEv: 0,
		winningOutcomes: []
	}
	const ideal = Array(numGames).fill(true)
	const next = new ArraySet()
	next.add(ideal)

	let index = 0
	while (next.size() > 0) {
		if (index++ > 100) {
			throw Error('Too many iterations to find winningOutcomes')
			break
		}

		const currentGroup = next.values()
		next.clear()
		const toRemove = []

		for (const currentBoolWeekOutcome of currentGroup) {
			const currentWeekOutcome = mapBoolToTeamNamesFromIdeal(
				gameData,
				ignoredGamesIndexes,
				currentBoolWeekOutcome,
				idealOutcome,
				worstOutcome
			)
			const { playerRankings, topScore, numTiedForFirst, numPlayersAtEachScore } =
				getUserOutcomeInputData(picksData, currentWeekOutcome)
			const userOutcome = getUserOutcome(
				ignoredGamesIndexes,
				userPicks,
				currentWeekOutcome,
				playerRankings,
				topScore,
				numTiedForFirst,
				numPlayersAtEachScore,
				nfeloTeamsWinChances,
				espnTeamsWinChances
			)

			const similarOutcomes = generateSimilarBoolOutcomes(currentBoolWeekOutcome)

			if (userOutcomeWinning(userOutcome)) {
				if (!output.winningOutcomes[userOutcome.missedWins.length])
					output.winningOutcomes[userOutcome.missedWins.length] = []

				output.winningOutcomes[userOutcome.missedWins.length].push({
					weekOutcome: currentWeekOutcome,
					userOutcome
				})

				output.numWinningOutcomes++
				output.nfeloChance += userOutcome.nfeloChance
				output.espnChance += userOutcome.espnChance

				next.addAll(similarOutcomes)
			} else {
				toRemove.push(...similarOutcomes)
			}
		}
		next.removeAll(toRemove)
	}

	for (let i = 0; i < output.winningOutcomes.length; i++) {
		if (!output.winningOutcomes[i]) output.winningOutcomes[i] = []
		else
			output.winningOutcomes[i].sort(
				(a, b) => a.userOutcome.tiedWith - b.userOutcome.tiedWith
			)
	}

	output.winningOutcomesPercent = (output.numWinningOutcomes / Math.pow(2, numGames)) * 100

	endTime = performance.now()
	console.log('Winning outcomes total time:', endTime - startTime, 'ms')

	return output
}

function mapBoolToTeamNamesFromIdeal(
	gameData: Game[],
	ignoredGamesIndexes: number[],
	boolWeekOutcome: boolean[],
	idealOutcome: string[],
	worstOutcome: string[]
): string[] {
	let j = 0

	return idealOutcome
		.map((team, i) => {
			if (ignoredGamesIndexes.includes(i)) return gameData[i].winner
			return boolWeekOutcome[j++] ? team : worstOutcome[i]
		})
		.filter((team): team is string => team !== undefined)
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

function getPlayerRankings(picksData: any[], weekOutcome: string[]): PlayerRanking[] {
	const playerRankings: PlayerRanking[] = []

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

	return playerRankings
}
export function getUserOutcomeInputData(picksData: any[], weekOutcome: string[]) {
	const playerRankings = getPlayerRankings(picksData, weekOutcome)
	const numPlayersAtEachScore: Record<number, number> = {}
	playerRankings.forEach(player => {
		numPlayersAtEachScore[player.score] = (numPlayersAtEachScore[player.score] || 0) + 1
	})
	const topScore = playerRankings[0].score

	return {
		playerRankings,
		topScore,
		numTiedForFirst: numPlayersAtEachScore[topScore],
		numPlayersAtEachScore
	}
}

export function getUserOutcome(
	ignoredGamesIndexes: number[],
	player: PlayerPicks,
	weekOutcome: string[],
	playerRankings: PlayerRanking[],
	topScore: number,
	numTiedForFirst: number,
	numPlayersAtEachScore: Record<number, number>,
	nfeloTeamsWinChances: Record<string, number>,
	espnTeamsWinChances: Record<string, number>
): UserOutcome {
	const playerRanking = playerRankings.find(p => p.name === player.name)!

	// Calculate position by counting number of players with higher scores
	const position = playerRankings.filter(p => p.score > playerRanking.score).length + 1

	const contenderForFirst = position === 1
	const contenderForTop2 = contenderForFirst || (position === 2 && numTiedForFirst === 1)

	const tiedWith = numPlayersAtEachScore[playerRanking.score] - 1
	const pointsAwayFromTopScore = topScore - playerRanking.score

	// Calculate missed wins
	const missedWins = weekOutcome
		.map((team, i) => (team !== player.picks[i] ? team : ''))
		.filter(Boolean)

	// Calculate chances
	let nfeloChance = 100
	let espnChance = 100
	for (let i = 0; i < weekOutcome.length; i++) {
		if (!ignoredGamesIndexes.includes(i)) {
			nfeloChance *= nfeloTeamsWinChances[weekOutcome[i]] / 100
			espnChance *= espnTeamsWinChances[weekOutcome[i]] / 100
		}
	}

	const ev = getWeekEv(player.name, playerRankings)

	return {
		contenderForFirst,
		contenderForTop2,
		position,
		numTiedForFirst,
		tiedWith,
		pointsAwayFromTopScore,
		missedWins,
		nfeloChance,
		espnChance,
		ev
	}
}

const PRIZE_MONEY = [100, 50, 25] // 1st, 2nd, 3rd place prize money

// TODO: tie breaker values should actually matter. Maybe monte carlo?
// export function getWeekEv(playerRankings: PlayerRanking[], playerName: string): number {
//     const playerPrizes = {}
//
//     for (const prize of PRIZE_MONEY) {
//
//     }
//
// 	return 0
// }

export function getWeekEvs(players: PlayerRanking[], roundToCents = true): Record<string, number> {
	const sorted = [...players].sort((a, b) => b.score - a.score)
	const payout: Record<string, number> = Object.fromEntries(players.map(p => [p.name, 0]))

	let rankStart = 1 // 1-based rank pointer into prizes

	for (let i = 0; i < sorted.length && rankStart <= PRIZE_MONEY.length; ) {
		// collect a same-score group
		const s = sorted[i].score
		const group: PlayerRanking[] = []
		let j = i
		while (j < sorted.length && sorted[j].score === s) {
			group.push(sorted[j])
			j++
		}

		// this tied group occupies ranks [rankStart .. rankStart + group.length - 1]
		const posStart = rankStart
		const posEnd = rankStart + group.length - 1

		// sum the prizes for the occupied positions that exist
		let pool = 0
		for (let pos = posStart; pos <= posEnd; pos++) {
			if (pos >= 1 && pos <= PRIZE_MONEY.length) pool += PRIZE_MONEY[pos - 1]
		}
		const share = pool / group.length

		for (const p of group) payout[p.name] += share

		rankStart += group.length
		i = j
	}

	if (roundToCents) {
		for (const k of Object.keys(payout)) payout[k] = Math.round(payout[k] * 100) / 100
	}
	return payout
}

export function getWeekEv(targetName: string, players: PlayerRanking[]): number {
	const pay = getWeekEvs(players)
	return pay[targetName] ?? 0
}
