import { test, describe, expect } from 'vitest'
import { getWeekEv, type PlayerRanking } from './weekOutcomesCalculatorUtils'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function createPlayerRankings(scores: number[]): PlayerRanking[] {
	return scores.map((score, index) => ({
		name: ALPHABET[index],
		score,
		tieBreaker: 0
	}))
}

function testGetWeek(scores: number[], expecteds: number[]) {
	let actuals = []
	for (const [index, _] of expecteds.entries()) {
		const name = ALPHABET[index]
		const actual = getWeekEv(name, createPlayerRankings(scores))
		actuals.push(actual)
	}
	expect(actuals).toEqual(expecteds)
}

describe('getWeekEv', () => {
	test('simplest tie 3rd', () => {
		const scores = [15, 14, 13, 12, 11]
		const expecteds = [100, 50, 25, 0, 0]
		testGetWeek(scores, expecteds)
	})

	test('tie first', () => {
		testGetWeek([15, 15, 14, 13, 12, 12], [75, 75, 25, 0, 0, 0])
	})

	test('tie top 3', () => {
		const scores = [15, 15, 15, 14, 14, 11]
		const expecteds = [58.33, 58.33, 58.33, 0, 0, 0]
		testGetWeek(scores, expecteds)
	})

	test('tie top 4', () => {
		const scores = [15, 15, 15, 15, 14, 11]
		const expecteds = [43.75, 43.75, 43.75, 43.75, 0]
		testGetWeek(scores, expecteds)
	})

	test('tie second', () => {
		const scores = [16, 15, 15, 14, 13, 11]
		const expecteds = [100, 37.5, 37.5, 0, 0, 0]
		testGetWeek(scores, expecteds)
	})

	test('tie second2', () => {
		const scores = [16, 15, 15, 14, 14, 11]
		const expecteds = [100, 37.5, 37.5, 0, 0, 0]
		testGetWeek(scores, expecteds)
	})

	test('tie 3rd', () => {
		const scores = [16, 15, 14, 14, 11]
		const expecteds = [100, 50, 12.5, 12.5, 0]
		testGetWeek(scores, expecteds)
	})

	test('tie first and 3rd', () => {
		const scores = [16, 16, 14, 14, 11]
		const expecteds = [75, 75, 12.5, 12.5, 0]
		testGetWeek(scores, expecteds)
	})
})
