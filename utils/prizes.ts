import type { ProbabilityByTotal } from './finalTotal'

interface PrizeContender {
	tieBreaker: number
	eligibleForWeeklyPrize: boolean
}

export function createPrizeSplitter(
	players: readonly PrizeContender[],
	probabilityByTotal: ProbabilityByTotal | undefined,
	prizes: readonly number[]
) {
	const tieBreakers = players.map(player => player.tieBreaker)
	const eligible = players.map(player => player.eligibleForWeeklyPrize)
	const possibleTotals = (probabilityByTotal ?? []).flatMap((probability, total) =>
		probability > 0 ? [{ total, probability }] : []
	)
	const expectedGroupPrizesCache = new Map<string, Float64Array>()

	function pooledPrize(firstPlace: number, numPlayers: number) {
		let pool = 0
		for (let place = firstPlace; place < Math.min(firstPlace + numPlayers, prizes.length); place++)
			pool += prizes[place]
		return pool
	}

	function expectedGroupPrizes(group: number[], firstPlace: number) {
		const key = `${firstPlace}:${group}`
		const cached = expectedGroupPrizesCache.get(key)
		if (cached) return cached

		const expected = new Float64Array(group.length)
		for (const { total, probability } of possibleTotals) {
			for (let i = 0; i < group.length; i++) {
				const distance = Math.abs(tieBreakers[group[i]] - total)
				let numCloser = 0
				let numAsClose = 0
				for (const other of group) {
					const otherDistance = Math.abs(tieBreakers[other] - total)
					if (otherDistance < distance) numCloser++
					else if (otherDistance === distance) numAsClose++
				}
				expected[i] += (probability * pooledPrize(firstPlace + numCloser, numAsClose)) / numAsClose
			}
		}
		expectedGroupPrizesCache.set(key, expected)
		return expected
	}

	return function splitPrizes(scores: ArrayLike<number>, prizePerPlayer: Float64Array) {
		prizePerPlayer.fill(0)

		let place = 0
		let previousScore = Infinity
		while (place < prizes.length) {
			let score = -1
			for (let p = 0; p < scores.length; p++)
				if (eligible[p] && scores[p] < previousScore && scores[p] > score) score = scores[p]
			if (score === -1) break

			const group: number[] = []
			for (let p = 0; p < scores.length; p++) if (eligible[p] && scores[p] === score) group.push(p)

			if (group.length === 1 || !possibleTotals.length) {
				const prize = pooledPrize(place, group.length) / group.length
				for (const p of group) prizePerPlayer[p] = prize
			} else {
				const groupPrizes = expectedGroupPrizes(group, place)
				group.forEach((p, i) => (prizePerPlayer[p] = groupPrizes[i]))
			}

			place += group.length
			previousScore = score
		}
	}
}
