export interface UserOutcome {
	contenderForFirst: boolean
	contenderForTop2: boolean
	tiedWith: number
	pointsAwayFromTopScore: number
	missedWins: string[]
	nfeloChance: number
	espnChance: number
	position: number
	numTiedForFirst: number
}

interface UserPositionStats {
	numWinningOutcomes: number
	winningOutcomesPercent: number
	nfeloChance: number
	espnChance: number
}

export interface UserStats {
	firstPlace: Record<string, UserPositionStats>
	top2: Record<string, UserPositionStats>
}

export interface WinningOutcome {
	weekOutcome: string[]
	userOutcome: UserOutcome
}

export interface SingleUsersStats extends UserPositionStats {
	winningOutcomes: WinningOutcome[][]
}

export const useWeekOutcomesStore = defineStore('weekOutcomeCombos', () => {
	const picksStore = usePicksStore()
	const gamesStore = useGamesStore()
	const nfeloStore = useNfeloStore()
	const espnAnalyticsStore = useEspnAnalyticsStore()

	// State
	const secondPlaceIsWinning = ref(false)
	const filterGames = ref(GAME_FILTERS.UNFINISHED)
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
			} else if (filterGames.value == GAME_FILTERS.NOWINNERS) {
				if (gamesStore.gameData[i].winner) ignoredGames.push(i)
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
	const userStats = ref({
		numWinningOutcomes: 0,
		winningOutcomesPercent: 0,
		nfeloChance: 0,
		espnChance: 0,
		winningOutcomes: []
	} as SingleUsersStats)
	const mustWins = ref([] as string[])
	const mustWinsWinChances = ref({
		nfelo: undefined as number | undefined,
		espn: undefined as number | undefined
	})
	watchEffect(() => {
		let start, end
		start = performance.now()

		if (!picksStore.picksData.length || !picksStore.user.name) return
		userStats.value = runFunctionRaw(
			getSingleUsersStats,
			picksStore.user.name,
			picksStore.picksData,
			ignoredGames.value,
			gamesStore.gameData,
			idealOutcome.value,
			worstOutcome.value,
			nfeloStore.nfeloTeamsWinChance,
			espnAnalyticsStore.espnTeamsWinChances,
			secondPlaceIsWinning.value
		)

		const allOutcomes = userStats.value.winningOutcomes.flat()
		mustWins.value = idealOutcome.value.filter((team, i) => {
			if (ignoredGames.value.includes(i)) return false
			return allOutcomes.every(outcome => outcome.weekOutcome.includes(team))
		})

		mustWinsWinChances.value.nfelo = mustWins.value.reduce((acc, team) => {
			return (acc * nfeloStore.nfeloTeamsWinChance[team]) / 100
		}, 100)

		mustWinsWinChances.value.espn = mustWins.value.reduce((acc, team) => {
			return (acc * espnAnalyticsStore.espnTeamsWinChances[team]) / 100
		}, 100)

		end = performance.now()
		console.log(`Time taken to calculate userStats: ${end - start}ms`)
	})
	const numPossibleOutcomes = computed(() => Math.pow(2, numGames.value))

	const gamesImportanceScores = computed(() => {
		const allWinningOutcomes = userStats.value.winningOutcomes.flat()
		const numHalfOutcomes = userStats.value.numWinningOutcomes / 2

		return idealOutcome.value.map((team, index) => {
			if (ignoredGames.value.includes(index) || !allWinningOutcomes.length) return 0

			const count = allWinningOutcomes.filter(
				outcome => outcome.weekOutcome[index] === team
			).length
			return ((count - numHalfOutcomes) / numHalfOutcomes) * 100
		})
	})

	const liveStats = ref<UserStats>({
		firstPlace: {} as Record<string, UserPositionStats>,
		top2: {} as Record<string, UserPositionStats>
	})
	picksStore.picksData.forEach(player => {
		liveStats.value.firstPlace[player.name] = {
			numWinningOutcomes: 0,
			winningOutcomesPercent: 0,
			nfeloChance: 0,
			espnChance: 0
		}
		liveStats.value.top2[player.name] = {
			numWinningOutcomes: 0,
			winningOutcomesPercent: 0,
			nfeloChance: 0,
			espnChance: 0
		}
	})
	const calcLiveStats = async () => {
		if (!picksStore.picksData.length) return liveStats.value

		const pickedGames = []
		for (let i = 0; i < gamesStore.gameData.length; i++) {
			if (gamesStore.gameData[i].winner) pickedGames.push(i)
		}

		// const numGamesToSim = gamesStore.gameData.length - pickedGames.length
		// if (numGamesToSim > maxGamesToSimLive.value) return liveStats

		loadingCalculations.value = true
		const stats = await getAllUsersStats(
			deepToRaw(picksStore.picksData),
			deepToRaw(pickedGames),
			deepToRaw(gamesStore.gameData),
			deepToRaw(nfeloStore.nfeloTeamsWinChance),
			deepToRaw(espnAnalyticsStore.espnTeamsWinChances)
		)
		loadingCalculations.value = false

		return stats
	}
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

	return {
		// State
		secondPlaceIsWinning,
		filterGames,
		maxGamesToSimLive,
		loadingCalculations,
		// Getters
		userStats: readonly(userStats),
		mustWins: readonly(mustWins),
		mustWinsWinChance: readonly(mustWinsWinChances),
		gamesImportanceScores,
		numPossibleOutcomes,
		liveStatsComputed
	}
})
