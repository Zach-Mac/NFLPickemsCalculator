import * as cheerio from 'cheerio'
import { useStorage } from '@vueuse/core'

const quarters = ['1st', '2nd', '3rd', '4th']
const blankUser = {
	name: '',
	picks: [],
	originalSeasonTotal: 0,
	tieBreaker: 0
}

const filterGames = ref(GAME_FILTERS.ALL)

export default function () {
	const picksTablePasteInput = useStorage('paste', '')
	// const filterGames = useStorage('filterGames', GAME_FILTERS.ALL)

	const playerName = useStorage('playerName', '')

	const user = computed(
		() => picksData.value.find(player => player.name == playerName.value) ?? blankUser
	)

	const html = computed(() => cheerio.load(picksTablePasteInput.value))

	function getWinner(game: Game): string {
		if (game.state == 'upcoming') return ''
		if (game.scoreHome == game.scoreAway) return 'tie'
		return game.scoreHome > game.scoreAway ? game.home : game.away
	}

	function loadHtmlData() {
		const $ = html.value
		gameData.value = $('th.week-header')
			.toArray()
			.map((th, i) => {
				const teamWithPossession = $(th).find('span').text()
				const splitText = $(th)
					.text()
					.split('\n')
					.map(t => t.trim())

				let state: GameState = 'upcoming'
				let timeLeft = ''
				let quarter = ''
				let ot = false

				if (splitText[6].includes('Final')) {
					state = 'finished'
					if (splitText[6].includes('OT')) ot = true
				} else if (splitText[6]) {
					state = 'active'
					timeLeft = splitText[6]

					for (const q of quarters) {
						if (splitText[6].includes(q)) {
							quarter = q
							timeLeft = splitText[6].slice(0, -3)
							break
						}
					}
				}

				const game: Game = {
					home: splitText[2],
					away: splitText[4],
					scoreHome: Number(splitText[1]),
					scoreAway: Number(splitText[5]),
					state,
					timeLeft,
					quarter,
					teamWithPossession,
					ot,
					winner: ''
				}
				game.winner = getWinner(game)

				return game
			})

		picksData.value = $('tbody tr')
			.toArray()
			.map(row => {
				const tds = $(row).find('td')

				const picks = tds
					.slice(3, -3)
					.toArray()
					.map(td => $(td).text())

				const weekTotal = Number(tds.eq(-3).text())
				const seasonTotal = Number(tds.eq(-2).text())

				return {
					name: tds.eq(2).text().trim(),
					picks,
					originalSeasonTotal: seasonTotal - weekTotal,
					tieBreaker: Number(tds.eq(-1).text())
				}
			})
	}

	watchEffect(loadHtmlData)

	return {
		filterGames,
		picksTablePasteInput,
		playerName,
		loadHtmlData,
		user
	}
}
