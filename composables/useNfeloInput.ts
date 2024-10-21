import { useStorage } from '@vueuse/core'

interface NfeloGame {
	home: string
	away: string
	homeWinPercent: number
	awayWinPercent: number
}

export default function () {
	const nfeloGamesInput = useStorage('nfeloPaste', '')

	const nfeloGames = computed(() => {
		const sanitized = nfeloGamesInput.value
			.replaceAll('\t', ' ')
			.replaceAll('\n', ' ')
			.replaceAll(/\s+/g, ' ')

		const split = sanitized
			.split(' Market Line Model Line Win % EV ')
			.filter(str => str.length > 0)
			.map(gameStr => gameStr.split(' '))

		const games: NfeloGame[] = split.map(gameStrSplit => {
			const awayName = gameStrSplit[0]
			const homeName = gameStrSplit.find(
				str => NFL_TEAM_NAMES.includes(str) && str != awayName
			)

			if (!homeName)
				throw new Error('Home team not found for game: ' + gameStrSplit.join(' '))

			const awayWinPercent = Number(gameStrSplit.find(str => str.includes('%'))?.slice(0, -1))
			const homeWinPercent = 100 - awayWinPercent

			return {
				home: NFL_TEAMS.find(team => team.name == homeName)?.abbreviation ?? '',
				away: NFL_TEAMS.find(team => team.name == awayName)?.abbreviation ?? '',
				homeWinPercent,
				awayWinPercent
			}
		})
		return games
	})
	const nfeloTeamsWinChance = computed(() => {
		const teams: Record<string, number> = {}
		nfeloGames.value.forEach(game => {
			if (!teams[game.home]) teams[game.home] = 0
			if (!teams[game.away]) teams[game.away] = 0

			teams[game.home] += game.homeWinPercent
			teams[game.away] += game.awayWinPercent
		})

		return teams
	})

	return { nfeloGamesInput, nfeloGames, nfeloTeamsWinChance }
}
