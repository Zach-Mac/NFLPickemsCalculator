export interface UserOutcome {
	contenderForFirst: boolean
	contenderForSecond: boolean
	tiedWith: number
	pointsAwayFromTopScore: number
	missedWins: string[]
	nfeloChance: number
	position: number
	numTiedForFirst: number
}

export interface UserStats {
	firstPlaceOutcomes: {
		weekOutcome: string[]
		userOutcome: UserOutcome
	}[][]
	secondPlaceOutcomes: {
		weekOutcome: string[]
		userOutcome: UserOutcome
	}[][]
	firstPlace: {
		nfeloChance: number
		numWinningOutcomes: number
		winningOutcomesPercentage: number
	}
	top2: {
		nfeloChance: number
		numWinningOutcomes: number
		winningOutcomesPercentage: number
	}
}
interface PlayerRanking {
	name: string
	score: number
	tieBreaker: number
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
	const statsForAllUsers = ref<Record<string, UserStats>>({})
	const maxGamesToSimLive = ref(16)
	const loadingCalculations = ref(false)
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

	const numWinningOutcomes = computed(() =>
		Object.values(winningOutcomes.value).reduce((acc, outcomes) => acc + outcomes.length, 0)
	)
	const numPossibleOutcomes = computed(() => Math.pow(2, numGames.value))

	const importantWinningOutcomes = computed(() => {
		return winningOutcomes.value[winningOutcomes.value.length - 1]
	})
	const gamesImportanceScores = computed(() => {
		const allWinningOutcomes = winningOutcomes.value.flat()
		const numHalfOutcomes = numWinningOutcomes.value / 2

		return idealOutcome.value.map((team, index) => {
			if (ignoredGames.value.includes(index) || !allWinningOutcomes.length) return 0

			const count = allWinningOutcomes.filter(
				outcome => outcome.weekOutcome[index] === team
			).length
			return ((count - numHalfOutcomes) / numHalfOutcomes) * 100
		})
	})
	const mustWins = computed(() => {
		const allOutcomes = winningOutcomes.value.flat()
		const mustWins = idealOutcome.value.filter((team, i) => {
			if (ignoredGames.value.includes(i)) return false
			return allOutcomes.every(outcome => outcome.weekOutcome.includes(team))
		})
		return mustWins
	})

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

	// Helper Functions
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

	interface LiveStatsInternal {
		firstPlace: {
			nfeloChance: Record<string, number>
			winningOutcomesPercent: Record<string, number>
		}
		top2: {
			nfeloChance: Record<string, number>
			winningOutcomesPercent: Record<string, number>
		}
	}
	const calcLiveStats = async () => {
		const pickedGames = []
		for (let i = 0; i < gamesStore.gameData.length; i++) {
			if (gamesStore.gameData[i].winner) pickedGames.push(i)
		}

		const liveStats: LiveStatsInternal = {
			firstPlace: {
				nfeloChance: {},
				winningOutcomesPercent: {}
			},
			top2: {
				nfeloChance: {},
				winningOutcomesPercent: {}
			}
		}

		const numGamesToSim = gamesStore.gameData.length - pickedGames.length
		if (numGamesToSim > maxGamesToSimLive.value) return liveStats

		loadingCalculations.value = true
		const stats = await getAllUsersStats(
			deepToRaw(picksStore.picksData),
			deepToRaw(pickedGames),
			deepToRaw(gamesStore.gameData),
			deepToRaw(nfeloStore.nfeloTeamsWinChance)
		)

		for (const userName of Object.keys(stats)) {
			const userStats = stats[userName]
			liveStats.firstPlace.nfeloChance[userName] = userStats.firstPlace.nfeloChance
			liveStats.top2.nfeloChance[userName] = userStats.top2.nfeloChance
			liveStats.firstPlace.winningOutcomesPercent[userName] =
				userStats.firstPlace.winningOutcomesPercentage
			liveStats.top2.winningOutcomesPercent[userName] =
				userStats.top2.winningOutcomesPercentage
		}
		loadingCalculations.value = false

		return liveStats
	}
	const liveStats = ref({
		firstPlace: {
			nfeloChance: {},
			winningOutcomesPercent: {}
		},
		top2: {
			nfeloChance: {},
			winningOutcomesPercent: {}
		}
	} as LiveStatsInternal)
	watch(
		() => [gamesStore.gameData, picksStore.picksData, nfeloStore.nfeloTeamsWinChance],
		async () => {
			liveStats.value = await calcLiveStats()
		},
		{ deep: true, immediate: true }
	)

	const liveStatsComputed = computed(() => {
		if (secondPlaceIsWinning.value) return liveStats.value.top2
		return liveStats.value.firstPlace
	})

	async function getStatsForAllUsers() {
		statsForAllUsers.value = await getAllUsersStats(
			picksStore.picksData,
			ignoredGames.value,
			unref(toRaw(unref(gamesStore.gameData))),
			nfeloStore.nfeloTeamsWinChance
		)
	}

	return {
		// State
		secondPlaceIsWinning,
		filterGames,
		maxGamesToSimLive,
		loadingCalculations,
		// Getters
		winningOutcomes,
		statsForAllUsers,
		importantWinningOutcomes,
		gamesImportanceScores,
		mustWins,
		numWinningOutcomes,
		numPossibleOutcomes,
		nfeloWinChance,
		mustWinsWinChance,
		liveStatsComputed,
		// Actions
		getStatsForAllUsers
		// getAllOutcomesForAllUsers
	}
})
