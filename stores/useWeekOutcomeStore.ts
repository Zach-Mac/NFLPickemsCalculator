interface PlayerRanking {
	name: string
	score: number
	tieBreaker: number
}
interface UserOutcome {
	contenderForFirst: boolean
	contenderForSecond: boolean
	tiedWith: number
	pointsAwayFromTopScore: number
	missedWins: string[]
	nfeloChance: number
	position: number
	numTiedForFirst: number
}

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

export const useWeekOutcomeStore = defineStore('weekOutcomeCombos', () => {
	const picksStore = usePicksStore()
	const gamesStore = useGamesStore()
	const nfeloStore = useNfeloStore()

	// State
	const secondPlaceIsWinning = ref(false)
	const filterGames = ref(GAME_FILTERS.ALL)
	const outcomesData = ref<
		Record<string, { weekOutcome: string[]; userOutcome: UserOutcome }[][]>
	>({})
	// filterGames.value = GAME_FILTERS.ALL

	// Helper Computeds
	const ignoredGames = computed(() => {
		const ignoredGames = []
		for (let i = 0; i < gamesStore.gameData.length; i++) {
			if (filterGames.value === GAME_FILTERS.NOTSTARTED) {
				if (gamesStore.gameData[i].state != 'upcoming') ignoredGames.push(i)
			} else if (filterGames.value == GAME_FILTERS.UNFINISHED) {
				if (gamesStore.gameData[i].state == 'finished') ignoredGames.push(i)
			} else return []
		}
		return ignoredGames
	})
	const numGames = computed(() => gamesStore.gameData.length - ignoredGames.value.length)
	const idealOutcome = computed(() => picksStore.user.picks)
	const worstOutcome = computed(() =>
		picksStore.user.picks.map((team, i) => {
			return team == gamesStore.gameData[i].home
				? gamesStore.gameData[i].away
				: gamesStore.gameData[i].home
		})
	)

	// Getters
	const winningOutcomes = computed(() => {
		let startTime, endTime, duration

		startTime = performance.now()

		const output: { weekOutcome: string[]; userOutcome: UserOutcome }[][] = []
		const ideal = Array(numGames.value).fill(true)
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
				const currentWeekOutcome = convertBoolWeekOutcomeToTeamNames(currentBoolWeekOutcome)
				const userOutcome = getUserOutcome(currentWeekOutcome)

				const similarOutcomes = generateSimilarBoolOutcomes(currentBoolWeekOutcome)

				if (userOutcomeWinning(userOutcome)) {
					if (!output[userOutcome.missedWins.length])
						output[userOutcome.missedWins.length] = []

					output[userOutcome.missedWins.length].push({
						weekOutcome: currentWeekOutcome,
						userOutcome
					})

					next.addAll(similarOutcomes)
				} else {
					toRemove.push(...similarOutcomes)
				}
			}
			next.removeAll(toRemove)
		}

		for (let i = 0; i < output.length; i++) {
			if (!output[i]) output[i] = []
		}

		endTime = performance.now()
		console.log('Total time:', endTime - startTime)

		return output
	})

	// const winningOutcomes = computed<{ weekOutcome: string[]; userOutcome: UserOutcome }[][]>(
	// 	() => {
	// 		if (Object.keys(outcomesData.value).length === 0) return []

	// 		const allUserOutcomes = outcomesData.value[picksStore.user.name]

	// 		return allUserOutcomes.map(outcomes =>
	// 			outcomes.filter(outcome => userOutcomeWinning(outcome.userOutcome))
	// 		)
	// 	}
	// )

	const importantWinningOutcomes = computed(() => {
		return winningOutcomes.value[winningOutcomes.value.length - 1]
	})
	const mustWins = computed(() => {
		const allOutcomes = winningOutcomes.value.flat()
		const mustWins = idealOutcome.value.filter((team, i) => {
			if (ignoredGames.value.includes(i)) return false
			return allOutcomes.every(outcome => outcome.weekOutcome.includes(team))
		})
		return mustWins
	})
	const numWinningOutcomes = computed(() =>
		Object.values(winningOutcomes.value).reduce((acc, outcomes) => acc + outcomes.length, 0)
	)
	const numPossibleOutcomes = computed(() => Math.pow(2, numGames.value))
	const nfeloWinChance = computed(() => {
		return winningOutcomes.value.flat().reduce((acc, outcome) => {
			return acc + outcome.userOutcome.nfeloChance
		}, 0)
	})
	const mustWinsWinChance = computed(() => {
		return mustWins.value.reduce((acc, team) => {
			return (acc * nfeloStore.nfeloTeamsWinChance[team]) / 100
		}, 100)
	})

	// Actions
	function loadOutcomesData() {}

	// Helper Functions
	function getAllOutcomes() {
		const outcomes: { weekOutcome: string[]; userOutcome: UserOutcome }[][] = []
		const totalOutcomes = Math.pow(2, numGames.value)

		for (let i = 0; i < totalOutcomes; i++) {
			const binaryStr = i.toString(2).padStart(numGames.value, '0')
			const boolWeekOutcome = binaryStr.split('').map(bit => bit === '1')
			const weekOutcome = convertBoolWeekOutcomeToTeamNames(boolWeekOutcome)
			const userOutcome = getUserOutcome(weekOutcome)

			if (!outcomes[userOutcome.missedWins.length]) {
				outcomes[userOutcome.missedWins.length] = []
			}
			outcomes[userOutcome.missedWins.length].push({
				weekOutcome,
				userOutcome
			})
		}

		// Fill in any empty arrays
		for (let i = 0; i < outcomes.length; i++) {
			if (!outcomes[i]) outcomes[i] = []
		}

		return outcomes
	}

	// function getAllOutcomesForAllUsers() {
	// 	let startTime, endTime, duration
	// 	startTime = performance.now()

	// 	const outcomes: Record<string, UserOutcome> = {}
	// 	const totalOutcomes = Math.pow(2, numGames.value)

	// 	for (let i = 0; i < totalOutcomes; i++) {
	// 		if (i % 1000 === 0) {
	// 			const midTime = performance.now()
	// 			console.log(i, 'out of', totalOutcomes, 'time:', midTime - startTime)
	// 		}
	// 		const binaryStr = i.toString(2).padStart(numGames.value, '0')
	// 		const boolWeekOutcome = binaryStr.split('').map(bit => bit === '1')
	// 		const weekOutcome = convertBoolWeekOutcomeToTeamNames(boolWeekOutcome)
	// 		const userOutcomes = getUserOutcomesForAllUsers(weekOutcome)

	// 		for (const [name, userOutcome] of Object.entries(userOutcomes)) {
	// 			if (!outcomes[name]) outcomes[name] = userOutcome
	// 		}
	// 	}

	// 	endTime = performance.now()
	// 	duration = endTime - startTime
	// 	console.log('Total time:', duration)

	// 	return outcomes
	// }

	function getAllOutcomesForAllUsers() {
		let startTime, endTime, duration
		startTime = performance.now()

		const outcomes: Record<string, { weekOutcome: string[]; userOutcome: UserOutcome }[][]> = {}
		const totalOutcomes = Math.pow(2, numGames.value)

		for (let i = 0; i < totalOutcomes; i++) {
			if (i % 1000 === 0) {
				const midTime = performance.now()
				console.log(i, 'out of', totalOutcomes, 'time:', midTime - startTime)
			}
			const binaryStr = i.toString(2).padStart(numGames.value, '0')
			const boolWeekOutcome = binaryStr.split('').map(bit => bit === '1')
			const weekOutcome = convertBoolWeekOutcomeToTeamNames(boolWeekOutcome)
			const userOutcomes = getUserOutcomesForAllUsers(weekOutcome)

			for (const [name, userOutcome] of Object.entries(userOutcomes)) {
				if (!outcomes[name]) outcomes[name] = []
				if (!outcomes[name][userOutcome.missedWins.length]) {
					outcomes[name][userOutcome.missedWins.length] = []
				}
				outcomes[name][userOutcome.missedWins.length].push({
					weekOutcome,
					userOutcome
				})
			}
		}

		// Fill in any empty arrays
		for (const name in outcomes) {
			for (let i = 0; i < outcomes[name].length; i++) {
				if (!outcomes[name][i]) outcomes[name][i] = []
			}
		}

		endTime = performance.now()
		duration = endTime - startTime
		console.log('Total time:', duration)

		return (outcomesData.value = outcomes)
	}

	function getUserOutcomesForAllUsers(weekOutcome: string[]): Record<string, UserOutcome> {
		const userOutcomes: Record<string, UserOutcome> = {}
		const playerRankings: PlayerRanking[] = []

		// Calculate scores and create rankings
		picksStore.picksData.forEach(player => {
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
		picksStore.picksData.forEach(player => {
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
				if (!ignoredGames.value.includes(i)) {
					nfeloChance *= nfeloStore.nfeloTeamsWinChance[weekOutcome[i]] / 100
				}
			}

			userOutcomes[player.name] = {
				contenderForFirst,
				contenderForSecond,
				position,
				numTiedForFirst,
				tiedWith,
				pointsAwayFromTopScore,
				missedWins,
				nfeloChance
			}
		})

		return userOutcomes
	}

	function getUserOutcome(weekOutcome: string[]): UserOutcome {
		let userRanking: PlayerRanking | undefined

		const playerRankings: PlayerRanking[] = [] as PlayerRanking[]
		picksStore.picksData.forEach(player => {
			let score = 0
			for (let i = 0; i < player.picks.length; i++) {
				if (player.picks[i] === weekOutcome[i]) score++
			}

			const ranking = {
				name: player.name,
				score,
				tieBreaker: player.tieBreaker
			}

			if (player.name === picksStore.user.name) {
				userRanking = ranking
			}

			// Find correct insertion point and insert
			const insertIndex = findInsertionIndex(playerRankings, ranking)
			playerRankings.splice(insertIndex, 0, ranking)
		})

		const numTiedForFirst = playerRankings.filter(
			player => player.score == playerRankings[0].score
		).length

		const numPlayersAtEachScore: Record<number, number> = {}
		playerRankings.forEach(player => {
			if (!numPlayersAtEachScore[player.score]) numPlayersAtEachScore[player.score] = 1
			else numPlayersAtEachScore[player.score]++
		})

		if (!userRanking)
			return {
				contenderForFirst: false,
				contenderForSecond: false,
				tiedWith: -1,
				pointsAwayFromTopScore: -1,
				missedWins: [],
				nfeloChance: 0,
				position: -1,
				numTiedForFirst: -1
			}

		const position =
			playerRankings.filter(player => player.score > userRanking!.score).length + 1

		const contenderForFirst = position === 1
		const contenderForSecond = position === 2 && numTiedForFirst === 1

		const tiedWith = numPlayersAtEachScore[userRanking.score] - 1
		const pointsAwayFromTopScore = playerRankings[0].score - userRanking.score

		const missedWins = weekOutcome
			.map((team, i) => {
				if (team == idealOutcome.value[i]) return ''
				return team
			})
			.filter(str => str != '')

		let nfeloChance = 100
		for (let i = 0; i < weekOutcome.length; i++) {
			if (!ignoredGames.value.includes(i)) {
				nfeloChance *= nfeloStore.nfeloTeamsWinChance[weekOutcome[i]] / 100
			}
		}

		return {
			contenderForFirst,
			contenderForSecond,
			tiedWith,
			pointsAwayFromTopScore,
			missedWins,
			nfeloChance,
			position,
			numTiedForFirst
		}
	}
	function convertBoolWeekOutcomeToTeamNames(boolWeekOutcome: boolean[]): string[] {
		let j = 0

		return idealOutcome.value.map((team, i) => {
			if (ignoredGames.value.includes(i)) return gamesStore.gameData[i].winner
			return boolWeekOutcome[j++] ? team : worstOutcome.value[i]
		})
	}
	function userOutcomeWinning(userOutcome: UserOutcome) {
		return (
			userOutcome.contenderForFirst ||
			(secondPlaceIsWinning.value && userOutcome.contenderForSecond)
		)
	}

	return {
		// State
		secondPlaceIsWinning,
		filterGames,
		outcomesData,
		// Getters
		winningOutcomes,
		importantWinningOutcomes,
		mustWins,
		numWinningOutcomes,
		numPossibleOutcomes,
		nfeloWinChance,
		mustWinsWinChance,
		// Actions
		getAllOutcomes,
		getAllOutcomesForAllUsers
	}

	// return {
	// 	// ------------------- Getters -------------------
	// 	ignoredGames,
	// 	numGames,
	// 	idealOutcome,
	// 	worstOutcome,
	// 	winningOutcomes,
	// 	importantWinningOutcomes,
	// 	mustWins,
	// 	numWinningOutcomes,
	// 	numPossibleOutcomes,
	// 	nfeloWinChance,
	// 	mustWinsWinChance,

	// 	// ------------------- Actions -------------------
	// 	// (No actions)

	// 	// ------------------- Helper Functions -------------------
	// 	getUserOutcome,
	// 	generateSimilarBoolOutcomes,
	// 	convertBoolWeekOutcomeToTeamNames
	// }
})
