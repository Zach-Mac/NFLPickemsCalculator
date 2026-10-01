import { describe, expect, it } from 'vitest'
import { createPrizeSplitter } from '../utils/prizes'
import type { ProbabilityByTotal } from '../utils/finalTotal'

const weeklyPrizes = [100, 50, 25]

function knownTotal(total: number): ProbabilityByTotal {
	const probabilities = Array(total + 1).fill(0)
	probabilities[total] = 1
	return probabilities
}

function splitPrizes(
	scores: number[],
	{
		tieBreakers = scores.map(() => 40),
		eligible = scores.map(() => true),
		probabilityByTotal = undefined as ProbabilityByTotal | undefined
	} = {}
) {
	const players = scores.map((_, i) => ({
		tieBreaker: tieBreakers[i],
		eligibleForWeeklyPrize: eligible[i]
	}))
	const prizePerPlayer = new Float64Array(scores.length)
	createPrizeSplitter(players, probabilityByTotal, weeklyPrizes)(scores, prizePerPlayer)
	return Array.from(prizePerPlayer)
}

describe.each([
	['no tiebreaker total', undefined],
	['equal tiebreaker guesses', knownTotal(45)]
])('ties split evenly with %s', (_, probabilityByTotal) => {
	const split = (scores: number[]) => splitPrizes(scores, { probabilityByTotal })

	it('pays places in order without ties', () => {
		expect(split([9, 8, 7, 6, 6])).toEqual([100, 50, 25, 0, 0])
	})

	it('pools first and second for a two way tie for first', () => {
		expect(split([9, 9, 7, 6, 6])).toEqual([75, 75, 25, 0, 0])
	})

	it('pools third and fourth for a two way tie for third', () => {
		expect(split([9, 9, 7, 7, 6])).toEqual([75, 75, 12.5, 12.5, 0])
	})

	it('pools all three prizes for a three way tie for first', () => {
		expect(split([9, 9, 9, 6, 6])).toEqual([175 / 3, 175 / 3, 175 / 3, 0, 0])
	})

	it('pools second and third for a two way tie for second', () => {
		expect(split([9, 8, 8, 6])).toEqual([100, 37.5, 37.5, 0])
	})

	it('splits all prizes across a tie bigger than the prize list', () => {
		expect(split([9, 9, 9, 9, 2])).toEqual([43.75, 43.75, 43.75, 43.75, 0])
	})

	it('leaves prizes unpaid when there are fewer players than places', () => {
		expect(split([4, 3])).toEqual([100, 50])
	})

	it('pays players with zero points', () => {
		expect(split([0, 0])).toEqual([75, 75])
	})
})

describe('tiebreaker with a known total', () => {
	const probabilityByTotal = knownTotal(45)

	it('gives the closest guess the higher place', () => {
		expect(splitPrizes([9, 9, 7], { tieBreakers: [50, 44, 45], probabilityByTotal })).toEqual([
			50, 100, 25
		])
	})

	it('treats over and under the same', () => {
		expect(splitPrizes([9, 9, 7], { tieBreakers: [42, 48, 45], probabilityByTotal })).toEqual([
			75, 75, 25
		])
	})

	it('orders second and third inside a tied group', () => {
		expect(
			splitPrizes([9, 8, 8, 8], { tieBreakers: [0, 30, 46, 60], probabilityByTotal })
		).toEqual([100, 12.5, 50, 12.5])
	})

	it('never lets a closer guess beat a higher score', () => {
		expect(splitPrizes([9, 8], { tieBreakers: [0, 45], probabilityByTotal })).toEqual([100, 50])
	})
})

describe('tiebreaker with an uncertain total', () => {
	it('averages prizes over the possible totals', () => {
		const probabilityByTotal = Array(51).fill(0)
		probabilityByTotal[40] = 0.75
		probabilityByTotal[50] = 0.25

		const [nearForty, nearFifty] = splitPrizes([9, 9], {
			tieBreakers: [40, 50],
			probabilityByTotal
		})
		expect(nearForty).toBeCloseTo(0.75 * 100 + 0.25 * 50)
		expect(nearFifty).toBeCloseTo(0.25 * 100 + 0.75 * 50)
	})
})

describe('late picks', () => {
	it('skips ineligible players so everyone below moves up', () => {
		expect(splitPrizes([10, 9, 8, 7], { eligible: [false, true, true, true] })).toEqual([
			0, 100, 50, 25
		])
	})

	it('skips ineligible players inside a tie', () => {
		expect(splitPrizes([9, 9, 8], { eligible: [true, false, true] })).toEqual([100, 0, 50])
	})
})
