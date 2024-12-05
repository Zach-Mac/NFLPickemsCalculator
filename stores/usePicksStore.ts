import * as cheerio from 'cheerio'
import { defaultPicksTablePasteWeekInputs } from '~/utils/defaults/defaultPicksTablesWeeks/defaultPicksTablesWeekInputs'

const blankUser = {
	name: '',
	picks: [] as string[],
	originalSeasonTotal: 0,
	tieBreaker: 0
}
export type PlayerPicks = typeof blankUser

export const usePicksStore = defineStore('picks', () => {
	const gamesStore = useGamesStore()

	// State

	const picksTablePasteWeekInputs = toReactive(
		useLocalStorage('picksTablePasteWeekInputs', defaultPicksTablePasteWeekInputs)
	)
	const playerName = useLocalStorage('playerName', '')
	const picksDataValidated = ref(false)

	// Getters
	const picksTablePasteInput = computed(
		() => picksTablePasteWeekInputs[gamesStore.selectedWeek - 1]
	)
	const picksTablePasteInputIsDefault = computed(
		() =>
			picksTablePasteInput.value ==
			defaultPicksTablePasteWeekInputs[gamesStore.selectedWeek - 1]
	)

	const picksData_ = computed(() => {
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
	const picksData = computed(() => {
		if (!picksTablePasteInput.value) {
			picksDataValidated.value = false
			return []
		}

		// Validate poolhostGameOrder
		for (let i = 0; i < gamesStore.gameData.length; i++) {
			if (
				gamesStore.gameData[i].home !== poolhostGameOrder.value[i] &&
				gamesStore.gameData[i].away !== poolhostGameOrder.value[i]
			) {
				picksDataValidated.value = false
				return []
			}
		}
		picksDataValidated.value = true
		return picksData_.value
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
	const prevSeasonTotals = computed(() => {
		return Object.fromEntries(
			Object.entries(picksData.value).map(([index, { name, originalSeasonTotal }]) => [
				name,
				originalSeasonTotal
			])
		)
	})
	const numGamesLeftAfterWeek = computed(() => {
		const seasonGamesLeft =
			NFL_GAMES_PER_WEEK.slice(gamesStore.currentWeek).reduce((acc, val) => acc + val, 0) ?? 0

		const playoffGamesLeft = 13
		const gamesLeftAfterWeek = seasonGamesLeft + playoffGamesLeft

		return gamesLeftAfterWeek
	})
	const numGamesLeft = computed(() => {
		return numGamesLeftAfterWeek.value + gamesStore.numGamesWithNoWinners
	})
	const prevNumGamesLeft = computed(() => {
		return numGamesLeftAfterWeek.value + gamesStore.gameData.length
	})

	const gameEvRanges = ref({} as Record<string, number[]>)
	const userGameEvRanges = computed(() => gameEvRanges.value[user.value.name] ?? [])
	const gameEvRangesLoading = ref(false)
	const gameEvRangesCalculated = ref(gamesStore.numGamesWithNoWinners > 0)
	async function calcUserGameEvRanges() {
		if (
			!picksData.value ||
			!picksData.value.length ||
			!user.value.name ||
			!user.value.picks.length ||
			!seasonEvs.value
		) {
			console.warn(
				'calcUserGameEvRanges: picksData.value or user.value is empty',
				!picksData.value,
				!picksData.value.length,
				!user.value,
				!seasonEvs.value
			)
			return
		}
		gameEvRangesLoading.value = true

		const winProb = 0.6
		const numSims = 10000

		// initialize gameEvRanges for all players
		picksData.value.forEach(player => {
			gameEvRanges.value[player.name] = []
		})

		for (let i = 0; i < gamesStore.gameData.length; i++) {
			if (gamesStore.gameData[i].winner && gamesStore.gameData[i].winner !== '') {
				picksData.value.forEach(player => {
					gameEvRanges.value[player.name].push(0)
				})
				continue
			}

			const totals = simulateSeasonTotalsAfterGame(i)

			const winEvs = await runSim(totals.win, numGamesLeft.value, winProb, numSims)
			const lossEvs = await runSim(totals.loss, numGamesLeft.value, winProb, numSims)

			// for each player
			picksData.value.forEach(player => {
				if (!seasonEvs.value || !seasonEvs.value[player.name])
					throw new Error(`seasonEvs.value[${player.name}] is undefined`)

				const ogUserEv = seasonEvs.value[player.name]

				const highestUserEvChange = winEvs[player.name].money - ogUserEv.money
				const lowestUserEvChange = lossEvs[player.name].money - ogUserEv.money

				const evDiff = Math.abs(highestUserEvChange) + Math.abs(lowestUserEvChange)

				gameEvRanges.value[player.name].push(evDiff)
			})
		}

		gameEvRangesLoading.value = false
		gameEvRangesCalculated.value = true
	}
	// reset gameEvRanges on week change
	watch(
		() => gamesStore.selectedWeek,
		() => {
			gameEvRanges.value = {}
			gameEvRangesCalculated.value = false
		}
	)

	const seasonEvsEvaluating = ref(false)
	const seasonEvs = computedAsync(
		async () => {
			const winProb = 0.6
			const numSims = 10000

			const evs = await runSim(seasonTotals.value, numGamesLeft.value, winProb, numSims)
			return evs
		},
		undefined,
		seasonEvsEvaluating
	)
	const previousSeasonEvs = computedAsync(async () => {
		const winProb = 0.6
		const numSims = 10000

		const evs = await runSim(prevSeasonTotals.value, prevNumGamesLeft.value, winProb, numSims)
		return evs
	})
	const seasonEvsChange = computed(() => {
		if (!seasonEvs.value || !previousSeasonEvs.value) return {}

		return Object.fromEntries(
			Object.entries(seasonEvs.value).map(([name, result]) => {
				const prevResult = previousSeasonEvs.value?.[name]
				const prevMoney = prevResult?.money ?? 0
				return [name, result.money - prevMoney]
			})
		)
	})

	// Actions
	function setPicksTablePasteInput(paste: string) {
		picksTablePasteWeekInputs[gamesStore.selectedWeek - 1] = paste
	}
	function resetPicksTablePasteInput() {
		picksTablePasteWeekInputs[gamesStore.selectedWeek - 1] =
			defaultPicksTablePasteWeekInputs[gamesStore.selectedWeek - 1]
	}
	function resetPicksTablePasteWeekInputs() {
		for (let i = 0; i < picksTablePasteWeekInputs.length; i++) {
			picksTablePasteWeekInputs[i] = defaultPicksTablePasteWeekInputs[i]
		}
	}

	function simulateSeasonTotalsAfterGame(gameIndex: number) {
		const hypotheticalSeasonTotals = {
			win: structuredClone(seasonTotals.value),
			loss: structuredClone(seasonTotals.value)
		}

		const userPick = user.value.picks[gameIndex]
		const winningTeam = userPick

		picksData.value.forEach(player => {
			const pick = player.picks[gameIndex]
			if (pick) {
				if (pick === winningTeam) hypotheticalSeasonTotals.win[player.name]++
				else hypotheticalSeasonTotals.loss[player.name]++
			}
		})
		return hypotheticalSeasonTotals
	}
	return {
		// State
		picksTablePasteInput,
		playerName,
		gameEvRanges,
		userGameEvRanges,
		gameEvRangesLoading,
		gameEvRangesCalculated,
		// Getters
		picksData,
		picksTablePasteInputIsDefault,
		poolhostGameOrder,
		picksDataValidated,
		seasonEvs,
		seasonEvsChange,
		seasonEvsEvaluating,
		user,
		playerTotals,
		numGamesLeft,
		// Actions
		calcUserGameEvRanges,
		setPicksTablePasteInput,
		resetPicksTablePasteInput,
		resetPicksTablePasteWeekInputs
		// getSeasonEvs
	}
})

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(usePicksStore, import.meta.hot))
}
