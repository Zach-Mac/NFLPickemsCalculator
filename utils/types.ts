export type GameWinner = 'home' | 'away' | '' | 'tie'

export type GameState = 'finished' | 'active' | 'upcoming'

export interface Game {
	scoreHome: number
	home: string
	away: string
	scoreAway: number
	state: GameState
	timeLeft: string
	quarter: string
	teamWithPossession: string
	ot: boolean
	winner: string
}

export interface PlayerPicks {
	name: string
	picks: Array<string>
	originalSeasonTotal: number
	tieBreaker: number
}
