import { useStorage } from '@vueuse/core'

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
	const nfeloGamesInput = useStorage('nfeloPaste', '')
	const nfeloGamesValidated = ref(false)

	// Getters
	const nfeloGames = computed(() => {
		if (!nfeloGamesInput.value) return []
		if (!picksStore.poolhostGameOrder.length) return []
		if (!gamesStore.gameData.length) return []

		const sanitized = nfeloGamesInput.value
			.replaceAll('\t', ' ')
			.replaceAll('\n', ' ')
			.replaceAll(/\s+/g, ' ')

		const split = sanitized
			.split(' Market Line Model Line Win % EV ')
			.filter(str => str.length > 0)
			.map(gameStr => gameStr.split(' '))

		const nfeloGames: NfeloGame[] = split.map(gameStrSplit => {
			const awayName = gameStrSplit[0]
			const homeName = gameStrSplit.find(
				str => NFL_TEAM_NAMES.includes(str) && str != awayName
			)

			if (!homeName) {
				console.error('Home team not found for game:', gameStrSplit.join(' '))
				nfeloGamesValidated.value = false
			}

			const awayWinPercent = Number(gameStrSplit.find(str => str.includes('%'))?.slice(0, -1))
			const homeWinPercent = 100 - awayWinPercent

			return {
				home: NFL_TEAMS.find(team => team.name == homeName)?.espnAbbrev ?? '',
				away: NFL_TEAMS.find(team => team.name == awayName)?.espnAbbrev ?? '',
				homeWinPercent,
				awayWinPercent
			}
		})

		// sort to match the order of the games in the poolhost
		const sorted = picksStore.poolhostGameOrder.map(team => {
			const nfeloGame = nfeloGames.find(g => g.home === team || g.away === team)
			if (!nfeloGame) {
				console.error(`No game found for team "${team}". nfeloGames:`, nfeloGames)
				// return blankNfeloGame
			}
			return nfeloGame
		})

		// check to make sure all games are accounted for
		if (sorted.length != nfeloGames.length) {
			console.error('Not all games accounted for in nfeloGames')
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

	return { nfeloGamesInput, nfeloGamesValidated, nfeloGames, nfeloTeamsWinChance }
})
