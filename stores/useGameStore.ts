export const useGamesStore = defineStore('games', () => {
	// State
	const espnScoreboard = ref<Scoreboard | undefined>()
	const gameData = ref<Game[]>([])
	const selectedWeek = ref()
	const apiLoading = ref(false)

	function $reset() {
		espnScoreboard.value = undefined
		gameData.value = []
		selectedWeek.value = undefined
	}

	// Getters
	// const espnGameData = computed(() => {
	// 	if (!espnScoreboard.value) return []
	// 	return espnScoreboard.value.events.map(event => {
	// 		const competition = event.competitions[0]
	// 		const homeTeam = competition.competitors.find(comp => comp.homeAway === 'home')!
	// 		const awayTeam = competition.competitors.find(comp => comp.homeAway === 'away')!

	// 		const state = getGameState(event.status.type.state)

	// 		return {
	// 			date: new Date(event.date),
	// 			home: homeTeam.team.abbreviation,
	// 			away: awayTeam.team.abbreviation,
	// 			scoreHome: Number(scoreHome),
	// 			scoreAway: Number(awayTeam.score),
	// 			state,
	// 			winner: competition.competitors.find(comp => comp.winner)?.team.abbreviation || '',
	// 			timeLeft: event.status.displayClock,
	// 			quarter: event.status.period.toString(),
	// 			teamWithPossession: event.status.type.detail,
	// 			ot: event.status.period > 4,
	// 			homeWinPercent: undefined,
	// 			awayWinPercent: undefined
	// 		} as Game
	// 	})
	// })
	// const gameData = computed(() => {
	// 	if (!espnGameData.value.length) return []
	// 	const picksStore = usePicksStore()
	// 	return picksStore.poolhostGameOrder.map(team => {
	// 		const espnGame = espnGameData.value.find(g => g.home === team || g.away === team)
	// 		if (!espnGame) {
	// 			console.error(`No game found for team "${team}". espnGameData:`, espnGameData.value)
	// 		}
	// 		return espnGame
	// 	})
	// })
	const currentWeek = computed(() => espnScoreboard.value?.week.number || 0)
	const currentSeason = computed(() => espnScoreboard.value?.season.year || 0)
	const currentSeasonType = computed(() => espnScoreboard.value?.season.type || '')

	function getPossession(event: EspnEvent): string {
		const competition = event.competitions[0]
		if (
			competition.situation?.possession ===
			competition.competitors.find(comp => comp.homeAway === 'home')?.team.id
		) {
			return 'home'
		} else if (
			competition.situation?.possession ===
			competition.competitors.find(comp => comp.homeAway === 'away')?.team.id
		) {
			return 'away'
		}
		return ''
	}

	// Actions
	const setGameData = (events: EspnEvent[]) => {
		const games: Game[] = []
		events.forEach(event => {
			const competition = event.competitions[0]
			const homeTeam = competition.competitors.find(comp => comp.homeAway === 'home')!
			const awayTeam = competition.competitors.find(comp => comp.homeAway === 'away')!

			const scoreHome = Number(homeTeam.score) || 0
			const scoreAway = Number(awayTeam.score) || 0

			const state = getGameState(event.status.type.state)

			const possession = getPossession(event)

			let winner = ''

			if (state === 'finished') {
				winner = competition.competitors.find(comp => comp.winner)?.team.abbreviation || ''
			} else if (state === 'active') {
				if (scoreHome > scoreAway) {
					winner = homeTeam.team.abbreviation
				} else if (scoreAway > scoreHome) {
					winner = awayTeam.team.abbreviation
				} else {
					winner = 'tie'
				}
			}

			games.push({
				date: new Date(event.date),
				home: homeTeam.team.abbreviation,
				away: awayTeam.team.abbreviation,
				scoreHome,
				scoreAway,
				state,
				winner,
				timeLeft: event.status.displayClock,
				quarter: event.status.period.toString(),
				possession,
				ot: event.status.period > 4,
				espnSituation: event.competitions[0].situation || undefined
			})
		})

		const picksStore = usePicksStore()
		gameData.value = picksStore.poolhostGameOrder.map(team => {
			const espnGame = games.find(g => g.home === team || g.away === team)
			if (!espnGame) {
				console.error(`No game found for team "${team}". espnGameData:`, games)
				throw Error(`No game found for team "${team}".`)
			}
			return espnGame
		})
	}

	const loadEspnScoreboard = async () => {
		try {
			apiLoading.value = true
			const scoreboard = await espnApi.getScoreboard(selectedWeek.value)
			espnScoreboard.value = scoreboard

			setGameData(scoreboard.events)
			apiLoading.value = false
		} catch (error) {
			console.error('Failed to load scoreboard:', error)
			// Handle the error appropriately (e.g., show a notification to the user)
		}
	}

	// TEMP
	// loadEspnScoreboard(8)

	const getGameState = (state: string): GameState => {
		switch (state) {
			case GameStateEnum.PRE:
				return 'upcoming'
			case GameStateEnum.POST:
				return 'finished'
			default:
				return 'active'
		}
	}

	const setAllGameWinners = (weekOutcome: string[]) => {
		if (!gameData.value || gameData.value.length === 0) {
			console.warn('No game data available to set winners.')
			return
		}

		gameData.value.forEach((game, i) => {
			if (game) {
				if (weekOutcome[i] !== undefined) {
					game.winner = weekOutcome[i]
				} else {
					console.warn(`No outcome provided for game at index ${i}.`)
				}
			} else {
				console.warn(`Game at index ${i} is undefined.`)
			}
		})
	}

	const setCertainGameWinners = (teamNames: string[]) => {
		if (!gameData.value || gameData.value.length === 0) {
			console.warn('No game data available to set winners.')
			return
		}

		gameData.value.forEach((game, index) => {
			if (game) {
				if (teamNames.includes(game.home)) {
					game.winner = game.home
				} else if (teamNames.includes(game.away)) {
					game.winner = game.away
				} else {
					console.warn(`Team not found in game at index ${index}.`)
				}
			} else {
				console.warn(`Game at index ${index} is undefined.`)
			}
		})
	}

	const getGameWithTeam = (team: string): Game | undefined => {
		if (!gameData.value || gameData.value.length === 0) {
			console.warn('No game data available to find the game.')
			return undefined
		}

		const game = gameData.value.find(game => game && (game.home === team || game.away === team))

		if (!game) {
			console.warn(`Game with team "${team}" not found.`)
		}

		return game
	}

	const teamWon = (team: string): boolean => {
		if (!gameData.value || gameData.value.length === 0) {
			console.warn('No game data available to check if team won.')
			return false
		}

		return gameData.value.some(game => game && game.winner === team)
	}

	const teamLost = (team: string): boolean => {
		const game = getGameWithTeam(team)
		if (!game) {
			console.warn(`Cannot determine if team "${team}" lost because the game was not found.`)
			return false
		}
		if (game.state === 'upcoming') {
			console.warn(`Game for team "${team}" has not started yet.`)
			return false
		}
		return game.winner !== team
	}

	// Return state, getters, and actions
	return {
		$reset,
		// State
		espnScoreboard,
		selectedWeek,
		gameData,
		apiLoading,
		// Getters
		// espnGameData,
		currentWeek,
		currentSeason,
		currentSeasonType,
		// Actions
		setAllGameWinners,
		setCertainGameWinners,
		getGameWithTeam,
		teamWon,
		teamLost,
		loadEspnScoreboard,
		getGameState
	}
})
