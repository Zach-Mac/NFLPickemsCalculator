import { z } from 'zod'

export interface Scoreboard {
	leagues: any[]
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
	notes: any[]
	status: EventStatus
	broadcasts: Broadcast[]
	leaders: any[]
	format: Format
	startDate: string
	broadcast: string
	geoBroadcasts: GeoBroadcast[]
	highlights: any[]
	headlines: Headline[]
	situation: Situation | undefined
}

export const TeamIdSchema = z.object({
	id: z.string()
})
export type TeamId = z.infer<typeof TeamIdSchema>

export const PlayTypeSchema = z.object({
	id: z.string().optional(),
	text: z.string().optional(),
	abbreviation: z.string().optional()
})
export type PlayType = z.infer<typeof PlayTypeSchema>

export const ProbabilitySchema = z.object({
	tiePercentage: z.number(),
	homeWinPercentage: z.number(),
	awayWinPercentage: z.number(),
	secondsLeft: z.number()
})
export type Probability = z.infer<typeof ProbabilitySchema>

export const PlayPositionSchema = z.object({
	yardLine: z.number().optional(),
	team: TeamIdSchema.optional()
})
export type PlayPosition = z.infer<typeof PlayPositionSchema>

export const TimeElapsedSchema = z.object({
	displayValue: z.string().optional()
})
export type TimeElapsed = z.infer<typeof TimeElapsedSchema>

export const DriveSchema = z.object({
	description: z.string().optional(),
	start: PlayPositionSchema.optional(),
	timeElapsed: TimeElapsedSchema.optional()
})
export type Drive = z.infer<typeof DriveSchema>

export const LinkSchema = z.object({
	rel: z.array(z.string()).optional(),
	href: z.string().optional(),
	text: z.string().optional(),
	isExternal: z.boolean().optional(),
	isPremium: z.boolean().optional(),
	language: z.string().optional(),
	shortText: z.string().optional()
})
export type Link = z.infer<typeof LinkSchema>

export const AthleteSchema = z.object({
	id: z.string().optional(),
	fullName: z.string().optional(),
	displayName: z.string().optional(),
	shortName: z.string().optional(),
	links: z.array(LinkSchema).optional(),
	headshot: z.string().optional(),
	jersey: z.string().optional(),
	position: z.string().optional(),
	team: TeamIdSchema.optional()
})
export type Athlete = z.infer<typeof AthleteSchema>

export const LastPlaySchema = z.object({
	id: z.string().optional(),
	type: PlayTypeSchema.optional(),
	text: z.string().optional(),
	scoreValue: z.number().optional(),
	team: TeamIdSchema.optional(),
	probability: ProbabilitySchema.optional(),
	drive: DriveSchema.optional(),
	start: PlayPositionSchema.optional(),
	end: PlayPositionSchema.optional(),
	statYardage: z.number().optional(),
	athletesInvolved: z.array(AthleteSchema).optional()
})
export type LastPlay = z.infer<typeof LastPlaySchema>

export const SituationSchema = z.object({
	lastPlay: LastPlaySchema.optional(),
	down: z.number().optional(),
	yardLine: z.number().optional(),
	distance: z.number().optional(),
	downDistanceText: z.string().optional(),
	shortDownDistanceText: z.string().optional(),
	possessionText: z.string().optional(),
	isRedZone: z.boolean().optional(),
	homeTimeouts: z.number().optional(),
	awayTimeouts: z.number().optional(),
	possession: z.string().optional()
})
export type Situation = z.infer<typeof SituationSchema>

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
