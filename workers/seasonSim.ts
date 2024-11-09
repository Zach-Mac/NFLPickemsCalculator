interface PlayerStats {
	prob: number
	money: number
}

interface SimOutput {
	[player: string]: PlayerStats
}

const prizeMoney = [750, 500, 300, 150]
const totalPrizeMoney = prizeMoney.reduce((sum, prize) => sum + prize, 0)

class SeasonSimulator {
	private readonly prizeMoneyArray = new Float32Array(prizeMoney)
	private readonly players: string[]
	private readonly currentScores: Float32Array
	private readonly numPlayers: number

	constructor(startingScores: Record<string, number>) {
		this.players = Object.keys(startingScores)
		this.numPlayers = this.players.length
		this.currentScores = new Float32Array(this.players.map(p => startingScores[p]))
	}

	// Fast random number generator (xoshiro128**)
	private xoshiro128ss = (() => {
		let a = 1,
			b = 2,
			c = 3,
			d = 4

		return () => {
			const t = b << 9
			let r = a * 5
			r = ((r << 7) | (r >>> 25)) * 9
			c ^= a
			d ^= b
			b ^= c
			a ^= d
			c ^= t
			d = (d << 11) | (d >>> 21)
			return (r >>> 0) / 4294967296
		}
	})()

	// Replace binomialRandom with an optimized version
	private binomialRandom(n: number, p: number): number {
		const mean = n * p
		const stdDev = Math.sqrt(n * p * (1 - p))
		if (stdDev === 0) return Math.round(mean)
		const normalApprox = this.normalRandom(mean, stdDev)
		// Clamp the result between 0 and n
		return Math.max(0, Math.min(n, Math.round(normalApprox)))
	}

	// Implement normalRandom using Box-Muller transform
	private normalRandom(mean: number, stdDev: number): number {
		let u = 0,
			v = 0
		while (u === 0) u = this.xoshiro128ss()
		while (v === 0) v = this.xoshiro128ss()
		const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
		return z * stdDev + mean
	}

	// Main simulation function
	public simulate(totalGamesLeft: number, winProb: number, numSimulations: number) {
		console.time('simulation')

		// Pre-allocate arrays
		const simWins = new Float32Array(this.numPlayers)
		const simMoney = new Float32Array(this.numPlayers)
		const finalScores = new Float32Array(this.numPlayers)
		const sortedIndices = new Uint16Array(this.numPlayers)

		// Run simulations
		for (let sim = 0; sim < numSimulations; sim++) {
			// Generate final scores
			for (let p = 0; p < this.numPlayers; p++) {
				finalScores[p] =
					this.currentScores[p] + this.binomialRandom(totalGamesLeft, winProb)
			}

			// Find winner and top 4
			// Initialize sorting indices and find max score
			let maxScore = -Infinity
			for (let i = 0; i < this.numPlayers; i++) {
				sortedIndices[i] = i
				if (finalScores[i] > maxScore) {
					maxScore = finalScores[i]
				}
			}

			// Count tied winners
			let tiedWinners = 0
			for (let i = 0; i < this.numPlayers; i++) {
				if (finalScores[i] === maxScore) {
					tiedWinners++
				}
			}

			// Distribute win credit among tied winners
			const winCredit = 1 / tiedWinners
			for (let i = 0; i < this.numPlayers; i++) {
				if (finalScores[i] === maxScore) {
					simWins[i] += winCredit
				}
			}

			// Sort indices for top 4
			sortedIndices.sort(
				(a, b) =>
					finalScores[b] - finalScores[a] || this.currentScores[b] - this.currentScores[a]
			)

			// // Distribute prize money
			// for (let i = 0; i < 4; i++) {
			// 	simMoney[sortedIndices[i]] += this.prizeMoneyArray[i]
			// }
			// Handle ties in prize money
			let prizeIndex = 0
			let currentPrizePosition = 0 // Tracks position in prizeMoneyArray

			while (
				prizeIndex < this.numPlayers &&
				currentPrizePosition < this.prizeMoneyArray.length
			) {
				let tieCount = 1

				// Count the number of players tied at the current position
				while (
					prizeIndex + tieCount < this.numPlayers &&
					finalScores[sortedIndices[prizeIndex]] ===
						finalScores[sortedIndices[prizeIndex + tieCount]] &&
					this.currentScores[sortedIndices[prizeIndex]] ===
						this.currentScores[sortedIndices[prizeIndex + tieCount]]
				) {
					tieCount++
				}

				// Calculate the number of prize positions available for this tie group
				const prizePositionsAvailable = Math.min(
					this.prizeMoneyArray.length - currentPrizePosition,
					tieCount
				)

				// Sum the prize money for the available positions
				const totalPrizeMoney = this.prizeMoneyArray
					.slice(currentPrizePosition, currentPrizePosition + prizePositionsAvailable)
					.reduce((sum, prize) => sum + prize, 0)

				// Average prize money per player in the tie group
				const prizePerPlayer = totalPrizeMoney / tieCount

				// Distribute the average prize money to all tied players
				for (let j = 0; j < tieCount; j++) {
					simMoney[sortedIndices[prizeIndex + j]] += prizePerPlayer
				}

				// Update indices
				prizeIndex += tieCount
				currentPrizePosition += prizePositionsAvailable

				// If no more prize positions are available, exit the loop
				if (currentPrizePosition >= this.prizeMoneyArray.length) {
					break
				}
			}
		}

		// Generate output
		// const output: SimOutput = {}
		// for (let i = 0; i < this.numPlayers; i++) {
		// 	output[this.players[i]] = {
		// 		prob: (simWins[i] / numSimulations) * 100,
		// 		money: Math.round((simMoney[i] / numSimulations) * 10) / 10
		// 	}
		// }
		// return Object.fromEntries(Object.entries(output).sort(([, a], [, b]) => b.money - a.money))
		// return just the money for each player
		const output: Record<string, number> = {}
		for (let i = 0; i < this.numPlayers; i++) {
			output[this.players[i]] = Math.round(simMoney[i] / numSimulations)
		}

		// sort by money
		const sortedOutput = Object.fromEntries(
			Object.entries(output).sort(([, a], [, b]) => b - a)
		)

		console.timeEnd('simulation')

		return sortedOutput
		// Sort by money
	}
}

// Usage

export async function runSim(
	scores: Record<string, number>,
	gamesLeft: number,
	winProb: number,
	numSimulations: number
) {
	const simulator = new SeasonSimulator(scores)
	const results = simulator.simulate(gamesLeft, winProb, numSimulations)

	// Print results
	// Object.entries(results)
	// 	.slice(0, 6)
	// 	.forEach(([player, stats], i) => {
	// 		console.log(
	// 			`${i + 1}. ${player.padEnd(13)} ${stats.money
	// 				.toString()
	// 				.padEnd(6)} ${stats.prob.toFixed(1)}%`
	// 		)
	// 	})
	// Object.entries(results)
	// 	.slice(0, 6)
	// 	.forEach(([player, money], i) => {
	// 		console.log(`${i + 1}. ${player.padEnd(13)} ${money}`)
	// 	})

	// Print totals
	const totalMoney = Object.values(results).reduce((sum, money) => sum + money, 0)
	// const totalProb = Object.values(results).reduce((sum, stats) => sum + stats.prob, 0)
	// const totalMoney = Object.values(results).reduce((sum, stats) => sum + stats.money, 0)

	// console.log(`Sum of probabilities: ${totalProb}`)
	// console.log(`Average money: ${totalMoney}`)
	if (totalMoney - totalPrizeMoney > 10)
		console.warn(`Total money exceeds total prize money. Total money: ${totalMoney}`)

	return results
}
