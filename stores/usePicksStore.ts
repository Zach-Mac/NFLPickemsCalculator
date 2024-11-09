import { useStorage } from '@vueuse/core'
import * as cheerio from 'cheerio'
import type { PoolhostTeamAbbreviation } from '~/utils/constants'

const blankUser = {
	name: '',
	picks: [] as string[],
	originalSeasonTotal: 0,
	tieBreaker: 0
}
export type PlayerPicks = typeof blankUser

const getWinner = (game: Game): string => {
	if (game.state === 'upcoming') return ''
	if (game.scoreHome === game.scoreAway) return 'tie'
	return game.scoreHome > game.scoreAway ? game.home : game.away
}

export const usePicksStore = defineStore('picks', () => {
	const gamesStore = useGamesStore()

	// State
	const picksTablePasteInput = useStorage('paste', '')
	const highlightTiedRows = useStorage('highlightTiedRows', true)
	const playerName = useStorage('playerName', '')
	const seasonEvMinus100 = useStorage('seasonEvMinus100', false)
	// const seasonEvs = ref({} as Record<string, number>)

	// Getters
	const picksData = computed(() => {
		const $ = cheerio.load(picksTablePasteInput.value)
		return $('tbody tr')
			.toArray()
			.map(row => {
				const tds = $(row).find('td')

				const picks = tds
					.slice(3, -3)
					.toArray()
					.map(td => {
						const abbreviation = $(td).text() as PoolhostTeamAbbreviation
						return POOLHOST_TO_ESPN_ABBREVIATION[abbreviation] ?? abbreviation
					})

				const weekTotal = Number(tds.eq(-3).text())
				const seasonTotal = Number(tds.eq(-2).text())

				return {
					name: tds.eq(2).text().trim(),
					picks,
					originalSeasonTotal: seasonTotal - weekTotal,
					tieBreaker: Number(tds.eq(-1).text())
				} as PlayerPicks
			})
	})
	const poolhostGameOrder = computed(() => {
		const $ = cheerio.load(picksTablePasteInput.value)
		return $('th.week-header')
			.toArray()
			.map((th, i) => {
				const splitText = $(th)
					.text()
					.split('\n')
					.map(t => t.trim())

				const home = splitText[2]

				const abbreviation = home as PoolhostTeamAbbreviation
				return POOLHOST_TO_ESPN_ABBREVIATION[abbreviation] ?? abbreviation
			})
	})
	const picksDataValidated = computed(() => {
		if (!picksTablePasteInput.value) return false

		// if poolhostgameorder doesn't match gameData, return false
		for (let i = 0; i < gamesStore.gameData.length; i++) {
			if (
				gamesStore.gameData[i].home !== poolhostGameOrder.value[i] &&
				gamesStore.gameData[i].away !== poolhostGameOrder.value[i]
			) {
				return false
			}
		}
		return true
	})

	const user = computed(() => {
		return picksData.value.find(player => player.name === playerName.value) ?? blankUser
	})

	const playerTotals = computed(() => {
		const totals: Record<string, { weekTotal: number; seasonTotal: number }> = {}
		picksData.value.forEach(player => {
			if (!totals[player.name]) {
				totals[player.name] = { weekTotal: 0, seasonTotal: player.originalSeasonTotal }
			}
			player.picks.forEach((pick, i) => {
				if (
					pick &&
					gamesStore.gameData[i]?.winner &&
					pick === gamesStore.gameData[i].winner
				) {
					totals[player.name].weekTotal++
				}
			})
			totals[player.name].seasonTotal += totals[player.name].weekTotal
		})
		return totals
	})

	const seasonTotals = computed(() => {
		return Object.fromEntries(
			Object.entries(playerTotals.value).map(([name, { seasonTotal }]) => [name, seasonTotal])
		)
	})
	const previousSeasonTotals = computed(() => {
		// seasonTotal - weekTotal
		return Object.fromEntries(
			Object.entries(playerTotals.value).map(([name, { weekTotal, seasonTotal }]) => [
				name,
				seasonTotal - weekTotal
			])
		)
	})
	const gamesLeft = computed(() => {
		const weeksLeft = 17 - gamesStore.currentWeek
		const seasonGamesLeft = weeksLeft * 16
		const playoffGamesLeft = 13
		return seasonGamesLeft + playoffGamesLeft
	})

	// const gameEvRanges = ref([] as number[])
	const gameEvRanges = ref({} as Record<string, number[]>)
	const userGameEvRanges = computed(() => gameEvRanges.value[user.value.name] ?? [])
	const gameEvRangesLoading = ref(false)
	async function calcUserGameEvRanges() {
		gameEvRangesLoading.value = true
		const evRanges = [] as number[]

		const winProb = 0.6
		const numSimulations = 10000

		if (!seasonEvs.value || !seasonEvs.value[user.value.name]) return []

		for (let i = 0; i < gamesStore.gameData.length; i++) {
			const seasonTotalsAfterGame = simulateSeasonTotalsAfterGame(i)
			const winEvs = await runSim(
				seasonTotalsAfterGame.win,
				gamesLeft.value,
				winProb,
				numSimulations
			)
			const lossEvs = await runSim(
				seasonTotalsAfterGame.loss,
				gamesLeft.value,
				winProb,
				numSimulations
			)

			const ogUserEv = seasonEvs.value[user.value.name]

			const highestUserEvChange = winEvs[user.value.name] - ogUserEv
			const lowestUserEvChange = lossEvs[user.value.name] - ogUserEv

			const evDiff = Math.abs(highestUserEvChange) + Math.abs(lowestUserEvChange)

			evRanges.push(evDiff)
		}

		gameEvRanges.value[user.value.name] = evRanges
		gameEvRangesLoading.value = false
	}

	const seasonEvAdjustment = computed(() => (seasonEvMinus100.value ? -100 : 0))
	const seasonEvs = computedAsync(async () => {
		const winProb = 0.6
		const numSimulations = 10000

		const evs = await runSim(seasonTotals.value, gamesLeft.value, winProb, numSimulations)
		return Object.fromEntries(
			Object.entries(evs).map(([name, money]) => [name, money + seasonEvAdjustment.value])
		)
	})
	const previousSeasonEvs = computedAsync(async () => {
		const winProb = 0.6
		const numSimulations = 10000

		const evs = await runSim(
			previousSeasonTotals.value,
			gamesLeft.value,
			winProb,
			numSimulations
		)
		return Object.fromEntries(
			Object.entries(evs).map(([name, money]) => [name, money + seasonEvAdjustment.value])
		)
	})
	const seasonEvsChange = computed(() => {
		if (!seasonEvs.value || !previousSeasonEvs.value) return {}
		return Object.fromEntries(
			Object.entries(seasonEvs.value).map(([name, money]) => [
				name,
				money - previousSeasonEvs.value![name]
			])
		)
	})

	// Actions

	function simulateSeasonTotalsAfterGame(gameIndex: number) {
		const seasonTotals: { win: Record<string, number>; loss: Record<string, number> } = {
			win: {},
			loss: {}
		}

		const userPick = user.value.picks[gameIndex]
		const winningTeam = userPick

		picksData.value.forEach(player => {
			if (!seasonTotals.win[player.name]) {
				seasonTotals.win[player.name] = player.originalSeasonTotal
			}
			if (!seasonTotals.loss[player.name]) {
				seasonTotals.loss[player.name] = player.originalSeasonTotal
			}
			const pick = player.picks[gameIndex]
			if (pick) {
				if (pick === winningTeam) seasonTotals.win[player.name]++
				else seasonTotals.loss[player.name]++
			}
		})
		return seasonTotals
	}

	// async function getSeasonEvs(gamesLeft: number, winProb: number, numSimulations: number) {
	// async function getSeasonEvs() {
	// 	const weeksLeft = 17 - gamesStore.currentWeek
	// 	const seasonGamesLeft = weeksLeft * 16
	// 	const playoffGamesLeft = 13
	// 	const gamesLeft = seasonGamesLeft + playoffGamesLeft

	// 	const winProb = 0.6

	// 	const numSimulations = 10000

	// 	seasonEvs.value = await runSim(scores.value, gamesLeft, winProb, numSimulations)
	// }

	return {
		// State
		picksTablePasteInput,
		highlightTiedRows,
		playerName,
		userGameEvRanges,
		gameEvRangesLoading,
		// Getters
		picksData,
		poolhostGameOrder,
		picksDataValidated,
		seasonEvs,
		seasonEvsChange,
		// poolhostGameData,
		user,
		playerTotals,
		// Actions
		calcUserGameEvRanges
		// getSeasonEvs
	}
})
