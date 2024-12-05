import * as cheerio from 'cheerio'
import { z } from 'zod'

function getProbabilityOfFinished(game: Game): Probability {
	return {
		tiePercentage: game.winner === 'tie' ? 1 : 0,
		homeWinPercentage: game.winner === game.home ? 1 : 0,
		awayWinPercentage: game.winner === game.away ? 1 : 0,
		secondsLeft: 0
	}
}

const EMPTY_PROBABILITY = {
	tiePercentage: 0,
	homeWinPercentage: 0,
	awayWinPercentage: 0
}

export const useEspnAnalyticsStore = defineStore('espnAnalytics', () => {
	const gamesStore = useGamesStore()
	// const espnWinChances = reactive(Array(gamesStore.gameData.length).fill(EMPTY_PROBABILITY))
	const espnWinChancesWeekData = useLocalStorage<Probability[][]>(
		'espnWinChancesWeekData',
		Array.from({ length: 18 }, () => [] as Probability[])
	)

	const espnWinChances = computed(() => espnWinChancesWeekData.value[gamesStore.selectedWeek - 1])

	function validateEspnWinChances(data: unknown): data is Probability[] {
		const result = z.array(ProbabilitySchema).safeParse(data)
		if (!result.success) {
			console.error('Invalid ESPN win probabilities:', result.error)
			return false
		}
		if (result.data.length !== gamesStore.gameData.length) {
			console.error('ESPN win probabilities length does not match game data length.')
			return false
		}
		return true
	}

	watchEffect(() => {
		if (!validateEspnWinChances(espnWinChances.value)) {
			espnWinChancesWeekData.value[gamesStore.selectedWeek - 1] = gamesStore.gameData.map(
				() => EMPTY_PROBABILITY
			)
		}
	})

	async function getEspnWinChances(includeUpcomingGames = true) {
		const weekIndex = gamesStore.selectedWeek - 1

		for (let i = 0; i < gamesStore.gameData.length; i++) {
			const game = gamesStore.gameData[i]
			if (game.espn.situation?.lastPlay?.probability) {
				espnWinChancesWeekData.value[weekIndex][i] =
					game.espn.situation.lastPlay.probability
			} else if (game.state === 'finished') {
				espnWinChancesWeekData.value[weekIndex][i] = getProbabilityOfFinished(game)
			} else if (game.state === 'upcoming' && includeUpcomingGames) {
				espnWinChancesWeekData.value[weekIndex][i] = await getEspnWinChance(game)
			} else {
				console.warn("Couldn't get win chance for game:", game)
			}
		}
	}
	watch(
		() => gamesStore.gameData,
		() => getEspnWinChances(false),
		{ immediate: true }
	)

	const missingUpcomingWinProbabilities = computed(() => {
		return espnWinChances.value.some(prob => isEqual(prob, EMPTY_PROBABILITY))
	})
	if (missingUpcomingWinProbabilities.value) {
		getEspnWinChances()
	}

	async function getEspnWinChance(game: Game): Promise<Probability> {
		const gamecastUrl = game.espn.gamecastLink

		const data = await $fetch(`/api/espn?url=${encodeURIComponent(gamecastUrl)}`)

		const $ = cheerio.load(data)

		const winChances = $('.matchupPredictor').text()

		const split = winChances.split('%')
		const awayWinPercentage = parseFloat(split[0]) / 100
		const homeWinPercentage = parseFloat(split[1]) / 100
		const tiePercentage = 1 - homeWinPercentage - awayWinPercentage

		return {
			tiePercentage,
			homeWinPercentage,
			awayWinPercentage
		}
	}

	const espnTeamsWinChances = computed(() => {
		const teamChances = {} as Record<string, number>

		espnWinChances.value.forEach((prob, i) => {
			const game = gamesStore.gameData[i]
			if (!game) return

			if (!teamChances[game.home]) teamChances[game.home] = 0
			if (!teamChances[game.away]) teamChances[game.away] = 0

			teamChances[game.home] += prob.homeWinPercentage * 100
			teamChances[game.away] += prob.awayWinPercentage * 100
		})

		return teamChances
	})

	return {
		espnWinChances,
		getEspnWinChances,
		missingUpcomingWinProbabilities,
		espnTeamsWinChances
	}
})

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useEspnAnalyticsStore, import.meta.hot))
}
