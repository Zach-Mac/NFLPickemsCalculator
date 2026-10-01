export type ProbabilityByTotal = number[]

type GameProgress = Pick<Game, 'state' | 'scoreHome' | 'scoreAway' | 'quarter' | 'timeLeft' | 'ot'>

// TODO: replace with a distribution fitted to real final totals
const FINAL_TOTAL_SD = 13.5
const SECONDS_PER_QUARTER = 15 * 60
const REGULATION_SECONDS = 4 * SECONDS_PER_QUARTER

export function finalTotalProbabilities(
	game: GameProgress,
	overUnder?: number
): ProbabilityByTotal | undefined {
	const currentTotal = game.scoreHome + game.scoreAway
	if (game.state === 'finished') return knownTotal(currentTotal)
	if (overUnder === undefined) return undefined

	const fractionLeft =
		game.state === 'upcoming' ? 1 : regulationSecondsLeft(game) / REGULATION_SECONDS
	return normalTotal(
		currentTotal + overUnder * fractionLeft,
		FINAL_TOTAL_SD * Math.sqrt(fractionLeft),
		currentTotal
	)
}

export function expectedTotal(probabilityByTotal: ProbabilityByTotal) {
	return probabilityByTotal.reduce((sum, probability, total) => sum + probability * total, 0)
}

export function likelyTotalRange(probabilityByTotal: ProbabilityByTotal, coverage: number) {
	const tail = (1 - coverage) / 2
	let cumulative = 0
	let low: number | undefined
	for (let total = 0; total < probabilityByTotal.length; total++) {
		cumulative += probabilityByTotal[total]
		if (low === undefined && cumulative > tail) low = total
		if (cumulative >= 1 - tail) return [low!, total] as const
	}
	const last = probabilityByTotal.length - 1
	return [low ?? last, last] as const
}

function regulationSecondsLeft({ quarter, timeLeft, ot }: GameProgress) {
	if (ot) return 0
	const [seconds = 0, minutes = 0] = timeLeft.split(':').map(Number).reverse()
	const quartersLeft = Math.max(0, 4 - Number(quarter))
	const secondsLeft = quartersLeft * SECONDS_PER_QUARTER + (minutes * 60 + seconds || 0)
	return Math.min(REGULATION_SECONDS, secondsLeft)
}

function normalTotal(mean: number, sd: number, minTotal: number): ProbabilityByTotal {
	if (sd < 0.5) return knownTotal(Math.max(minTotal, Math.round(mean)))

	const maxTotal = Math.ceil(mean + 6 * sd)
	const probabilities = Array<number>(maxTotal + 1).fill(0)
	let sum = 0
	for (let total = minTotal; total <= maxTotal; total++) {
		probabilities[total] = Math.exp(-(((total - mean) / sd) ** 2) / 2)
		sum += probabilities[total]
	}
	return probabilities.map(probability => probability / sum)
}

function knownTotal(total: number): ProbabilityByTotal {
	const probabilities = Array<number>(total + 1).fill(0)
	probabilities[total] = 1
	return probabilities
}
