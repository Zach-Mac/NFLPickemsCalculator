import { defaultNfeloPasteInputs } from '~/utils/defaults/defaultNfeloPastesWeeks/defaultNfeloPasteInputs'

const blankNfeloGame = {
	home: '',
	away: '',
	homeWinPercent: 0,
	awayWinPercent: 0
}
type NfeloGame = typeof blankNfeloGame

export const useNfeloStore = defineStore('nfelo', () => {
	const picksStore = usePicksStore()
	const gamesStore = useGamesStore()
	// State
	const nfeloGamesWeekInputs = toReactive(
		useLocalStorage('nfeloGamesWeekInputs', defaultNfeloPasteInputs)
	)
	const nfeloGamesValidated = ref(false)

	// Getters
	const nfeloGamesInput = computed(() => nfeloGamesWeekInputs[gamesStore.selectedWeek - 1])

	const nfeloGamesInputIsDefault = computed(
		() => nfeloGamesInput.value == defaultNfeloPasteInputs[gamesStore.selectedWeek - 1]
	)

	const nfeloGames = computed(() => {
		if (!nfeloGamesInput.value) return []
		if (!picksStore.poolhostGameOrder.length) return []
		if (!gamesStore.gameData.length) return []

		// New: CSV parsing path. Expecting a header like: home_team,away_team,nfelo_projected_home_spread,nfelo_projected_home_win_probability,projected_winner,projected_winner_probability
		let parsedGames: NfeloGame[] = []
		const raw = nfeloGamesInput.value.trim()

		if (raw.toLowerCase().startsWith('home_team,away_team')) {
			const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0)
			// remove header
			lines.shift()
			for (const line of lines) {
				// Simple CSV split (fields not expected to be quoted). If quoting becomes necessary, replace with a proper CSV parser (e.g., Papa Parse).
				const cols = line.split(',').map(c => c.trim())
				if (cols.length < 4) continue
				const homeAbbrev = cols[0]
				const awayAbbrev = cols[1]
				const homeProbRaw = parseFloat(cols[3]) // nfelo_projected_home_win_probability (0-1)
				const homeWinPercent = isFinite(homeProbRaw) ? homeProbRaw * 100 : 0
				const awayWinPercent = 100 - homeWinPercent
				parsedGames.push({
					home: NFL_TEAMS.find(team => team.nfeloAbbrev == homeAbbrev)?.espnAbbrev ?? '',
					away: NFL_TEAMS.find(team => team.nfeloAbbrev == awayAbbrev)?.espnAbbrev ?? '',
					homeWinPercent,
					awayWinPercent
				})
			}
		} else {
			console.warn('Using legacy free-form paste parsing for nfeloGamesInput.')

			// Legacy fallback: original free-form paste parsing
			const sanitized = raw
				.replaceAll('\t', ' ')
				.replaceAll('\n', ' ')
				.replaceAll(/\s+/g, ' ')

			const split = sanitized
				.split('Market Line Model Line Win % EV ')
				.filter(str => str.length > 0)
				.map(gameStr => gameStr.split(' '))

			parsedGames = split.map(gameStrSplit => {
				const awayName = gameStrSplit[0]
				const homeName = gameStrSplit.find(
					str => NFL_TEAM_NAMES.includes(str) && str != awayName
				)

				if (!homeName) {
					console.error('Home team not found for game:', gameStrSplit.join(' '))
					nfeloGamesValidated.value = false
				}

				const awayWinPercent = Number(
					gameStrSplit.find(str => str.includes('%'))?.slice(0, -1)
				)
				const homeWinPercent = 100 - awayWinPercent

				return {
					home: NFL_TEAMS.find(team => team.name == homeName)?.espnAbbrev ?? '',
					away: NFL_TEAMS.find(team => team.name == awayName)?.espnAbbrev ?? '',
					homeWinPercent,
					awayWinPercent
				}
			})
		}

		// sort to match the order of the games in the poolhost
		const sorted = picksStore.poolhostGameOrder.map(team => {
			const nfeloGame = parsedGames.find(g => g.home === team || g.away === team)
			if (!nfeloGame) {
				console.error(`No game found for team "${team}". nfeloGames:`, parsedGames)
			}
			return nfeloGame
		})

		// check to make sure all games are accounted for
		if (sorted.filter(Boolean).length !== parsedGames.length) {
			console.error('Not all games accounted for in nfeloGames (parsed vs sorted mismatch).')
		}

		return sorted
	})
	watchEffect(() => {
		nfeloGamesValidated.value = validateNfeloGames()
	})

	function validateNfeloGames() {
		if (!nfeloGamesInput.value) return false
		if (!picksStore.poolhostGameOrder.length) return true
		if (!gamesStore.gameData.length) return true
		if (!nfeloGames.value.length) return false

		for (let i = 0; i < nfeloGames.value.length; i++) {
			const nfeloGame = nfeloGames.value[i]
			const game = gamesStore.gameData[i]

			if (!nfeloGame) {
				console.error(
					'nfeloGames validation failed:',
					'No nfelo game found for game:',
					game
				)
				return false
			}

			if (nfeloGame.home != game.home || nfeloGame.away != game.away) {
				console.error(
					'nfeloGames validation failed:',
					'nfeloGame.home:',
					nfeloGame.home,
					'game.home:',
					game.home,
					'nfeloGame.away:',
					nfeloGame.away,
					'game.away:',
					game.away
				)
				return false
			}
		}

		return true
	}

	const nfeloTeamsWinChance = computed(() => {
		if (!nfeloGamesValidated.value) return {}

		const teams: Record<string, number> = {}
		nfeloGames.value.forEach(game => {
			if (!game) return

			if (!teams[game.home]) teams[game.home] = 0
			if (!teams[game.away]) teams[game.away] = 0

			teams[game.home] += game.homeWinPercent
			teams[game.away] += game.awayWinPercent
		})

		return teams
	})

	// Actions

	function setNfeloGamesInput(paste: string) {
		nfeloGamesWeekInputs[gamesStore.selectedWeek - 1] = paste
	}
	function resetNfeloGamesInput() {
		nfeloGamesWeekInputs[gamesStore.selectedWeek - 1] =
			defaultNfeloPasteInputs[gamesStore.selectedWeek - 1]
	}
	function resetNfeloGamesInputs() {
		for (let i = 0; i < nfeloGamesWeekInputs.length; i++) {
			nfeloGamesWeekInputs[i] = defaultNfeloPasteInputs[i]
		}
	}

	return {
		nfeloGamesInput,
		nfeloGamesInputIsDefault,
		nfeloGamesValidated,
		nfeloGames,
		nfeloTeamsWinChance,
		setNfeloGamesInput,
		resetNfeloGamesInput,
		resetNfeloGamesInputs
	}
})

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useNfeloStore, import.meta.hot))
}
