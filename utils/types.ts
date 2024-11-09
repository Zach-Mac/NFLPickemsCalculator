export type GameDataSource = 'poolhost' | 'espn'

export interface Scoreboard {
	leagues: any[] // Type based on actual content of leagues array
	season: Season
	week: Week
	events: EspnEvent[]
}

interface Season {
	type: number
	year: number
}

interface Week {
	number: number
}

export interface EspnEvent {
	id: string
	uid: string
	date: string
	name: string
	shortName: string
	season: SeasonDetails
	week: Week
	competitions: Competition[]
	links: Link[]
	status: EventStatus
}

interface SeasonDetails extends Season {
	slug: string
}

interface Competition {
	id: string
	uid: string
	date: string
	attendance: number
	type: CompetitionType
	timeValid: boolean
	neutralSite: boolean
	conferenceCompetition: boolean
	playByPlayAvailable: boolean
	recent: boolean
	venue: Venue
	competitors: Competitor[]
	notes: any[] // Type based on actual content of notes array
	status: EventStatus
	broadcasts: Broadcast[]
	leaders: any[] // Type based on actual content of leaders array
	format: Format
	startDate: string
	broadcast: string
	geoBroadcasts: GeoBroadcast[]
	highlights: any[] // Type based on actual content of highlights array
	headlines: Headline[]
	situation: Situation | undefined
}

export interface Situation {
	lastPlay: LastPlay
	down: number
	yardLine: number
	distance: number
	downDistanceText: string
	shortDownDistanceText: string
	possessionText: string
	isRedZone: boolean
	homeTimeouts: number
	awayTimeouts: number
	possession: string
}

interface LastPlay {
	id: string
	type: PlayType
	text: string
	scoreValue: number
	team: TeamId
	probability: Probability
	drive: Drive
	start: PlayPosition
	end: PlayPosition
	statYardage: number
	athletesInvolved: Athlete[]
}

interface PlayType {
	id: string
	text: string
	abbreviation: string
}

interface TeamId {
	id: string
}

interface Probability {
	tiePercentage: number
	homeWinPercentage: number
	awayWinPercentage: number
	secondsLeft: number
}

interface Drive {
	description: string
	start: PlayPosition
	timeElapsed: TimeElapsed
}

interface PlayPosition {
	yardLine: number
	team: TeamId
}

interface TimeElapsed {
	displayValue: string
}

interface Athlete {
	id: string
	fullName: string
	displayName: string
	shortName: string
	links: Link[]
	headshot: string
	jersey: string
	position: string
	team: TeamId
}

interface CompetitionType {
	id: string
	abbreviation: string
}

interface Venue {
	id: string
	fullName: string
	address: Address
	indoor: boolean
}

interface Address {
	city: string
	state: string
}

interface Competitor {
	id: string
	uid: string
	type: string
	order: number
	homeAway: string
	winner: boolean
	team: Team
	score: string
	linescores: LineScore[]
	statistics: any[] // Type based on actual content of statistics array
	records: Record[]
}

interface Team {
	id: string
	uid: string
	location: string
	name: string
	abbreviation: string
	displayName: string
	shortDisplayName: string
	color: string
	alternateColor: string
	isActive: boolean
	venue: VenueId
	links: Link[]
	logo: string
}

interface VenueId {
	id: string
}

interface Link {
	rel: string[]
	href: string
	text: string
	isExternal: boolean
	isPremium: boolean
	language?: string
	shortText?: string
}

interface LineScore {
	value: number
}

interface Record {
	name: string
	abbreviation?: string
	type: string
	summary: string
}

interface EventStatus {
	clock: number
	displayClock: string
	period: number
	type: StatusType
	isTBDFlex?: boolean
}

interface StatusType {
	id: string
	name: string
	state: string
	completed: boolean
	description: string
	detail: string
	shortDetail: string
}

interface Broadcast {
	market: string
	names: string[]
}

interface Format {
	regulation: Regulation
}

interface Regulation {
	periods: number
}

interface GeoBroadcast {
	type: BroadcastType
	market: Market
	media: Media
	lang: string
	region: string
}

interface BroadcastType {
	id: string
	shortName: string
}

interface Market {
	id: string
	type: string
}

interface Media {
	shortName: string
}

interface Headline {
	type: string
	description: string
	shortLinkText: string
}
