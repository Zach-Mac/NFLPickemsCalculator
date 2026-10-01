import { countBits } from '@/utils/bits'
import { createPrizeSplitter } from '@/utils/prizes'

// TODO: stats output too big for many games

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

function newPrizeByGameResult(numPlayers: number, numGames: number) {
	return {
		chanceHomeWon: new Float64Array(numGames),
		chanceAwayWon: new Float64Array(numGames),
		prizeIfHomeWon: new Float64Array(numPlayers * numGames),
		prizeIfAwayWon: new Float64Array(numPlayers * numGames)
	}
}
type PrizeByGameResult = ReturnType<typeof newPrizeByGameResult>

function addOutcomeChance(tally: PrizeByGameResult, homeWins: number, chance: number) {
	for (let bit = 0; bit < tally.chanceHomeWon.length; bit++) {
		if (homeWins & (1 << bit)) tally.chanceHomeWon[bit] += chance
		else tally.chanceAwayWon[bit] += chance
	}
}

function addPrize(tally: PrizeByGameResult, player: number, homeWins: number, chance: number, prize: number) {
	const numGames = tally.chanceHomeWon.length
	for (let bit = 0; bit < numGames; bit++) {
		if (homeWins & (1 << bit)) tally.prizeIfHomeWon[player * numGames + bit] += chance * prize
		else tally.prizeIfAwayWon[player * numGames + bit] += chance * prize
	}
}

export function getAllUsersStats(
	picksData: any[],
	ignoredGamesIndexes: number[],
	gameData: Game[],
	nfeloTeamsWinChances: Record<string, number>,
	espnTeamsWinChances: Record<string, number>,
	weeklyPrizes: readonly number[],
	tiebreakerProbabilityByTotal?: ProbabilityByTotal
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
	const nfeloWeekEv = new Float64Array(players.length)
	const espnWeekEv = new Float64Array(players.length)
	const nfeloPrizeByGameResult = newPrizeByGameResult(players.length, openGameIndexes.length)
	const espnPrizeByGameResult = newPrizeByGameResult(players.length, openGameIndexes.length)
	const scores = new Uint16Array(players.length)
	const splitPrizes = createPrizeSplitter(picksData, tiebreakerProbabilityByTotal, weeklyPrizes)
	const prizePerPlayer = new Float64Array(players.length)

	for (let homeWins = 0; homeWins < totalOutcomes; homeWins++) {
		const awayWins = ~homeWins & allOpenGames

		let nfeloChance = 100
		let espnChance = 100
		for (let bit = 0; bit < openGameIndexes.length; bit++) {
			const homeWon = homeWins & (1 << bit)
			nfeloChance *= homeWon ? nfeloOdds[bit].home : nfeloOdds[bit].away
			espnChance *= homeWon ? espnOdds[bit].home : espnOdds[bit].away
		}
		addOutcomeChance(nfeloPrizeByGameResult, homeWins, nfeloChance)
		addOutcomeChance(espnPrizeByGameResult, homeWins, espnChance)

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

		splitPrizes(scores, prizePerPlayer)

		for (let p = 0; p < players.length; p++) {
			const contenderForFirst = scores[p] === topScore
			const contenderForTop2 =
				contenderForFirst || (numAtTopScore === 1 && scores[p] === secondScore)

			if (contenderForFirst) addOutcome(firstPlace, p, nfeloChance, espnChance)
			if (contenderForTop2) addOutcome(top2, p, nfeloChance, espnChance)

			const prize = prizePerPlayer[p]
			if (prize) {
				nfeloWeekEv[p] += (nfeloChance / 100) * prize
				espnWeekEv[p] += (espnChance / 100) * prize
				addPrize(nfeloPrizeByGameResult, p, homeWins, nfeloChance, prize)
				addPrize(espnPrizeByGameResult, p, homeWins, espnChance, prize)
			}
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

	const weekEv = Object.fromEntries(
		picksData.map((player, p) => [player.name, { nfelo: nfeloWeekEv[p], espn: espnWeekEv[p] }])
	)

	const pickSwings = (tally: PrizeByGameResult, player: number) =>
		gameData.map((game, gameIndex) => {
			const bit = openGameIndexes.indexOf(gameIndex)
			if (bit === -1) return NaN
			const i = player * openGameIndexes.length + bit
			const ifHomeWon = tally.prizeIfHomeWon[i] / tally.chanceHomeWon[bit]
			const ifAwayWon = tally.prizeIfAwayWon[i] / tally.chanceAwayWon[bit]
			const pick = picksData[player].picks[gameIndex]
			if (pick === game.home) return ifHomeWon - ifAwayWon
			if (pick === game.away) return ifAwayWon - ifHomeWon
			return NaN
		})
	const weekEvPickSwings = Object.fromEntries(
		picksData.map((player, p) => [
			player.name,
			{ nfelo: pickSwings(nfeloPrizeByGameResult, p), espn: pickSwings(espnPrizeByGameResult, p) }
		])
	)

	return {
		firstPlace: toPositionStats(firstPlace),
		top2: toPositionStats(top2),
		weekEv,
		weekEvPickSwings
	}
}
