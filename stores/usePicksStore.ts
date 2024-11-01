import { useStorage } from '@vueuse/core'
import * as cheerio from 'cheerio'
import type { PoolhostTeamAbbreviation } from '~/utils/constants'

const blankUser = {
	name: '',
	picks: [],
	originalSeasonTotal: 0,
	tieBreaker: 0
}

export const usePicksStore = defineStore('picks', () => {
	// State
	const picksTablePasteInput = useStorage('paste', '')
	const highlightTiedRows = useStorage('highlightTiedRows', true)
	const playerName = useStorage('playerName', '')

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
				}
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
		const gamesStore = useGamesStore()
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
		const gamesStore = useGamesStore()
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

	// Actions

	// Helpers
	const getWinner = (game: Game): string => {
		if (game.state === 'upcoming') return ''
		if (game.scoreHome === game.scoreAway) return 'tie'
		return game.scoreHome > game.scoreAway ? game.home : game.away
	}

	return {
		// State
		picksTablePasteInput,
		highlightTiedRows,
		playerName,
		// Getters
		picksData,
		poolhostGameOrder,
		picksDataValidated,
		// poolhostGameData,
		user,
		playerTotals
	}
})
