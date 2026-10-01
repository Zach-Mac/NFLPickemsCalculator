import { describe, expect, it } from 'vitest'
import {
	expectedTotal,
	finalTotalProbabilities,
	likelyTotalRange,
	type ProbabilityByTotal
} from '../utils/finalTotal'

const upcoming = {
	state: 'upcoming' as const,
	scoreHome: 0,
	scoreAway: 0,
	quarter: '0',
	timeLeft: '0:00',
	ot: false
}

const sum = (probabilities: ProbabilityByTotal) => probabilities.reduce((a, b) => a + b, 0)
const sd = (probabilities: ProbabilityByTotal) => {
	const mu = expectedTotal(probabilities)
	const variance = probabilities.reduce(
		(acc, probability, total) => acc + probability * (total - mu) ** 2,
		0
	)
	return Math.sqrt(variance)
}

describe('finalTotalProbabilities', () => {
	it('puts everything on the final score once the game is finished', () => {
		const probabilities = finalTotalProbabilities({
			...upcoming,
			state: 'finished',
			scoreHome: 27,
			scoreAway: 7
		})!
		expect(probabilities[34]).toBe(1)
		expect(sum(probabilities)).toBe(1)
	})

	it('needs an over/under before the game is finished', () => {
		expect(finalTotalProbabilities(upcoming)).toBeUndefined()
		expect(finalTotalProbabilities({ ...upcoming, state: 'active', quarter: '2' })).toBeUndefined()
	})

	it('centres an upcoming game on the over/under', () => {
		const probabilities = finalTotalProbabilities(upcoming, 42.5)!
		expect(sum(probabilities)).toBeCloseTo(1, 12)
		expect(expectedTotal(probabilities)).toBeCloseTo(42.5, 1)
	})

	it('never goes below the current total in a live game', () => {
		const probabilities = finalTotalProbabilities(
			{ ...upcoming, state: 'active', scoreHome: 20, scoreAway: 10, quarter: '3', timeLeft: '7:30' },
			42.5
		)!
		expect(sum(probabilities)).toBeCloseTo(1, 12)
		expect(probabilities.slice(0, 30).every(probability => probability === 0)).toBe(true)
		expect(expectedTotal(probabilities)).toBeGreaterThan(30 + 42.5 * 0.375)
	})

	it('narrows as the game runs out', () => {
		const live = (quarter: string) =>
			finalTotalProbabilities({ ...upcoming, state: 'active', quarter, timeLeft: '10:00' }, 42.5)!
		expect(sd(live('2'))).toBeLessThan(sd(finalTotalProbabilities(upcoming, 42.5)!))
		expect(sd(live('4'))).toBeLessThan(sd(live('2')))
	})

	it('expects no more points in overtime', () => {
		const probabilities = finalTotalProbabilities(
			{ ...upcoming, state: 'active', scoreHome: 24, scoreAway: 24, quarter: '5', ot: true },
			42.5
		)!
		expect(probabilities[48]).toBe(1)
	})
})

describe('likelyTotalRange', () => {
	it('is a single total once the total is known', () => {
		const finished = finalTotalProbabilities({
			...upcoming,
			state: 'finished',
			scoreHome: 27,
			scoreAway: 7
		})!
		expect(likelyTotalRange(finished, 0.8)).toEqual([34, 34])
	})

	it('covers the middle of the distribution around the over/under', () => {
		const [low, high] = likelyTotalRange(finalTotalProbabilities(upcoming, 42.5)!, 0.8)
		expect(low + high).toBeCloseTo(85, -1)
		expect(high - low).toBeGreaterThan(30)
		expect(high - low).toBeLessThan(40)
	})
})
