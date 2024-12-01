import { z } from 'zod'
import { defaultSelectedWeek } from '~/utils/defaults/defaultInputs'

const possessionOptions = ['home', 'away', ''] as const
const gameStateOptions = ['finished', 'active', 'upcoming'] as const

const PossessionZodEnum = z.enum(possessionOptions)
const GameStateZodEnum = z.enum(gameStateOptions)

const gameSchema = z.object({
	date: z.string().optional(),
	scoreHome: z.number(),
	home: z.string(),
	away: z.string(),
	scoreAway: z.number(),
	state: GameStateZodEnum,
	timeLeft: z.string(),
	quarter: z.string(),
	possession: PossessionZodEnum,
	ot: z.boolean(),
	winner: z.string().optional(),
	espn: z.object({
		situation: SituationSchema.optional(),
		gamecastLink: z.string()
	})
})

export type Game = z.infer<typeof gameSchema>
type GameState = (typeof gameStateOptions)[number]

const editGameOptions = {
	state: gameStateOptions,
	possession: possessionOptions
}

function validateGameData(data: unknown): data is Game[] {
	const result = z.array(gameSchema).safeParse(data)
	if (!result.success) {
		console.error('Invalid game data:', result.error)
		return false
	}
	return true
}

function getPossession(event: EspnEvent) {
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

export const useGamesStore = defineStore('games', () => {
	// State
	const scoreboardCache = useLocalStorage('scoreboardCache', {} as Record<number, Scoreboard>)
	const espnScoreboard = ref<Scoreboard | undefined>()
	const gameData = useLocalStorage('gameData', [] as Game[])
	const lastEspnUpdate = useLocalStorage('lastEspnUpdate', 0)
	const selectedWeek = ref(defaultSelectedWeek)
	const apiLoading = ref(false)
	const showEditGamesDialog = ref(false)
	const editGameIndex = ref(-1)
	const currentWeek = useLocalStorage('currentWeek', 0)
	const currentSeason = useLocalStorage('currentSeason', 0)
	const currentSeasonType = useLocalStorage('currentSeasonType', 0)
	const loadingScoreboard = ref(false)

	if (!validateGameData(gameData.value)) {
		gameData.value = []
		currentWeek.value = 0
		currentSeason.value = 0
		currentSeasonType.value = 0
	}
	watch(gameData, () => {
		gameData.value.forEach(game => {
			if (game.winner === undefined) {
				game.winner = ''
			}
		})
	})

	// Getters
	const numGamesWithNoWinners = computed(() => {
		return gameData.value.filter(game => !game.winner || game.winner === '').length
	})

	// Actions
	function setMetadata(scoreboard: Scoreboard) {
		currentWeek.value = scoreboard.week.number
		currentSeason.value = scoreboard.season.year
		currentSeasonType.value = scoreboard.season.type
	}

	const setGameData = (events: EspnEvent[]) => {
		console.warn('setGameData')
		const games: Game[] = []
		events.forEach(event => {
			const competition = event.competitions[0]
			const homeTeam = competition.competitors.find(comp => comp.homeAway === 'home')!
			const awayTeam = competition.competitors.find(comp => comp.homeAway === 'away')!
			const scoreHome = Number(homeTeam.score) || 0
			const scoreAway = Number(awayTeam.score) || 0

			const state = getGameState(event.status.type.state)
			const possession = getPossession(event)
			const situation = event.competitions[0].situation || undefined

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
				date: event.date,
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
				espn: {
					situation: situation,
					gamecastLink:
						event.links.find(link => link.text?.includes('Gamecast'))?.href || ''
				}
			})
		})

		const picksStore = usePicksStore()
		const allGamesFound =
			picksStore.poolhostGameOrder.length == games.length &&
			picksStore.poolhostGameOrder.every(team =>
				games.some(g => g.home === team || g.away === team)
			)

		console.warn('allGamesFound:', allGamesFound)

		if (allGamesFound) {
			gameData.value = picksStore.poolhostGameOrder.map(team => {
				const espnGame = games.find(g => g.home === team || g.away === team)!
				return espnGame
			})
		} else {
			console.error("Poolhost doesn't match espn game data.")
			console.debug('Poolhost:', picksStore.poolhostGameOrder)
			console.debug('ESPN:', games)

			gameData.value = games
		}
	}

	function editGame(index: number) {
		showEditGamesDialog.value = true
		editGameIndex.value = index
	}

	const loadEspnScoreboard = async (forceReload = false) => {
		const week = selectedWeek.value

		apiLoading.value = true
		loadingScoreboard.value = true
		try {
			if (!forceReload && scoreboardCache.value[week]) {
				espnScoreboard.value = scoreboardCache.value[week]
			} else {
				espnScoreboard.value = await espnApi.getScoreboard(week)
				scoreboardCache.value[week] = espnScoreboard.value
				lastEspnUpdate.value = Date.now()
			}

			setMetadata(espnScoreboard.value)
			setGameData(espnScoreboard.value.events)
		} catch (error) {
			console.error('Failed to load scoreboard:', error)
		} finally {
			apiLoading.value = false
			// Add small delay to let UI update
			setTimeout(() => {
				loadingScoreboard.value = false
			}, 100)
		}
	}

	const loadEspnScoreboardForWeek = async (week: number, forceReload = false) => {
		apiLoading.value = true
		loadingScoreboard.value = true
		try {
			if (!forceReload && scoreboardCache.value[week]) {
				espnScoreboard.value = scoreboardCache.value[week]
			} else {
				espnScoreboard.value = await espnApi.getScoreboard(week)
				scoreboardCache.value[week] = espnScoreboard.value
				lastEspnUpdate.value = Date.now()
			}

			setMetadata(espnScoreboard.value)
			setGameData(espnScoreboard.value.events)
		} catch (error) {
			console.error('Failed to load scoreboard:', error)
		} finally {
			apiLoading.value = false
			setTimeout(() => {
				loadingScoreboard.value = false
			}, 100)
		}
	}

	watch(selectedWeek, () => loadEspnScoreboard(), { immediate: true })

	const reloadScoreboard = () => loadEspnScoreboard(true)

	const setAllGameWinners = (weekOutcome: string[] | readonly string[]) => {
		if (!gameData.value || gameData.value.length === 0) return

		gameData.value.forEach((game, i) => {
			if (game) {
				if (weekOutcome[i] !== undefined) game.winner = weekOutcome[i]
				else console.warn(`No outcome provided for game at index ${i}.`)
			} else {
				console.warn(`Game at index ${i} is undefined.`)
			}
		})
	}
	const setCertainGameWinners = (teamNames: string[] | readonly string[]) => {
		if (!gameData.value || gameData.value.length === 0) return

		gameData.value.forEach((game, index) => {
			if (game) {
				if (teamNames.includes(game.home)) game.winner = game.home
				else if (teamNames.includes(game.away)) game.winner = game.away
				else console.warn(`Team not found in game at index ${index}.`)
			} else {
				console.warn(`Game at index ${index} is undefined.`)
			}
		})
	}
	const clearGameWinners = () => {
		if (!gameData.value || gameData.value.length === 0) return

		gameData.value.forEach(game => {
			if (game) game.winner = ''
		})
	}

	const getGameWithTeam = (team: string): Game | undefined => {
		if (!gameData.value || gameData.value.length === 0) return undefined

		const game = gameData.value.find(game => game && (game.home === team || game.away === team))
		if (!game) console.warn(`Game with team "${team}" not found.`)

		return game
	}
	const teamWon = (team: string): boolean => {
		if (!gameData.value || gameData.value.length === 0) return false
		return gameData.value.some(game => game && game.winner === team)
	}
	const teamLost = (team: string): boolean => {
		const game = getGameWithTeam(team)
		if (!game) {
			console.warn(`Cannot determine if team "${team}" lost because the game was not found.`)
			return false
		}
		if (game.state === 'upcoming') return false
		return game.winner !== team
	}

	return {
		editGameOptions,
		// State
		espnScoreboard,
		selectedWeek,
		gameData,
		apiLoading,
		showEditGamesDialog,
		editGameIndex,
		lastEspnUpdate,
		currentWeek,
		currentSeason,
		currentSeasonType,
		loadingScoreboard,
		// Getters
		numGamesWithNoWinners,
		// Actions
		editGame,
		setAllGameWinners,
		setCertainGameWinners,
		clearGameWinners,
		getGameWithTeam,
		teamWon,
		teamLost,
		reloadScoreboard,
		loadEspnScoreboard,
		loadEspnScoreboardForWeek
	}
})
