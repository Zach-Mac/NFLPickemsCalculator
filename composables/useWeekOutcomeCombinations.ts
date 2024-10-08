interface PlayerRanking {
	name: string
	score: number
	tieBreaker: number
}
interface UserOutcome {
	userPosition: number
	tiedWith: number
	pointsAwayFromTopScore: number
	missedWins: string[]
}

function generateSimilarBoolOutcomes(boolWeekOutcome: boolean[]): boolean[][] {
	const similarOutcomes: boolean[][] = []
	for (let i = 0; i < boolWeekOutcome.length; i++) {
		const copy = boolWeekOutcome.slice()
		if (copy[i]) {
			copy[i] = false
			similarOutcomes.push(copy)
		}
	}
	return similarOutcomes
}

export default function () {
	const { user, filterGames } = useUserInput()

	const ignoredGames = computed(() => {
		if (filterGames.value == GAME_FILTERS.NOTSTARTED) {
			const ignoredGames = []
			for (let i = 0; i < gameData.value.length; i++) {
				if (gameData.value[i].state != 'upcoming') {
					ignoredGames.push(i)
				}
			}
			return ignoredGames
		}
		if (filterGames.value == GAME_FILTERS.UNFINISHED) {
			const ignoredGames = []
			for (let i = 0; i < gameData.value.length; i++) {
				if (gameData.value[i].state == 'finished') {
					ignoredGames.push(i)
				}
			}
			return ignoredGames
		}
		return []
	})

	const numGames = computed(() => gameData.value.length - ignoredGames.value.length)

	const idealOutcome = computed(() => user.value.picks)
	const worstOutcome = computed(() =>
		user.value.picks.map((team, i) => {
			return team == gameData.value[i].home ? gameData.value[i].away : gameData.value[i].home
		})
	)

	function getUserOutcome(weekOutcome: string[]): UserOutcome {
		const playerRankings: PlayerRanking[] = [] as PlayerRanking[]
		picksData.value.forEach(player => {
			let score = 0
			player.picks.forEach((pick, i) => {
				if (pick == weekOutcome[i]) score++
			})
			playerRankings.push({ name: player.name, score, tieBreaker: player.tieBreaker })
		})
		playerRankings.sort((a, b) => {
			if (a.score == b.score) return b.tieBreaker - a.tieBreaker
			return b.score - a.score
		})

		const numPlayersAtEachScore: Record<number, number> = {}
		playerRankings.forEach(player => {
			if (!numPlayersAtEachScore[player.score]) numPlayersAtEachScore[player.score] = 1
			else numPlayersAtEachScore[player.score]++
		})

		const userRanking = playerRankings.find(player => player.name == user.value.name)
		if (!userRanking)
			return { userPosition: -1, tiedWith: -1, pointsAwayFromTopScore: -1, missedWins: [] }

		const userPosition =
			playerRankings.filter(player => player.score > userRanking.score).length + 1
		const tiedWith = numPlayersAtEachScore[userRanking.score] - 1
		const pointsAwayFromTopScore = playerRankings[0].score - userRanking.score

		const missedWins = weekOutcome
			.map((team, i) => {
				if (team == idealOutcome.value[i]) return ''
				return team
			})
			.filter(str => str != '')

		return { userPosition, tiedWith, pointsAwayFromTopScore, missedWins }
	}

	function convertBoolWeekOutcomeToTeamNames(boolWeekOutcome: boolean[]): string[] {
		let j = 0

		return idealOutcome.value.map((team, i) => {
			if (ignoredGames.value.includes(i)) return gameData.value[i].winner
			return boolWeekOutcome[j++] ? team : worstOutcome.value[i]
		})
	}

	const winningOutcomes = computed(() => {
		const output: { weekOutcome: string[]; userOutcome: UserOutcome }[][] = []
		const ideal = Array(numGames.value).fill(true)
		const next = new ArraySet()
		next.add(ideal)

		let index = 0
		while (next.size() > 0) {
			if (index++ > 10) {
				throw Error('Too many iterations')
				break
			}
			const currentGroup = next.values()
			next.clear()

			const toRemove = []

			for (const currentBoolWeekOutcome of currentGroup) {
				const currentWeekOutcome = convertBoolWeekOutcomeToTeamNames(currentBoolWeekOutcome)
				const userOutcome = getUserOutcome(currentWeekOutcome)

				const similarOutcomes = generateSimilarBoolOutcomes(currentBoolWeekOutcome)
				if (userOutcome.userPosition == 1) {
					if (!output[userOutcome.missedWins.length])
						output[userOutcome.missedWins.length] = []

					output[userOutcome.missedWins.length].push({
						weekOutcome: currentWeekOutcome,
						userOutcome
					})

					next.addAll(similarOutcomes)
				} else {
					toRemove.push(...similarOutcomes)
				}
			}
			next.removeAll(toRemove)
		}

		for (let i = 0; i < output.length; i++) {
			if (!output[i]) output[i] = []
		}

		return output
	})
	const importantWinningOutcomes = computed(() => {
		return winningOutcomes.value[winningOutcomes.value.length - 1]
	})
	const mustWins = computed(() => {
		const allOutcomes = winningOutcomes.value.flat()
		const mustWins = idealOutcome.value.filter(team =>
			allOutcomes.every(outcome => outcome.weekOutcome.includes(team))
		)
		return mustWins
	})

	const numWinningOutcomes = computed(() =>
		Object.values(winningOutcomes.value).reduce((acc, outcomes) => acc + outcomes.length, 0)
	)
	const numPossibleOutcomes = computed(() => Math.pow(2, numGames.value))

	return {
		winningOutcomes,
		importantWinningOutcomes,
		mustWins,
		numWinningOutcomes,
		numPossibleOutcomes
	}
}
