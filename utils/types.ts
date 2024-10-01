export type GameWinner = 'home' | 'away' | 'none' | 'tie'

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
	winner: string
}

export interface PlayerPicks {
	name: string
	picks: Array<string>
	realRank: string
	originalSeasonTotal: number
	tieBreaker: number
}

export interface SortBy {
	key: string
	order: boolean | 'desc' | 'asc' | undefined
}
