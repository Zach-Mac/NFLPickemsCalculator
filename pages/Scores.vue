<script setup lang="ts">
import * as vNG from 'v-network-graph'
import Papa from 'papaparse'
// import scoresData from '../simulation/spreadspoke_scores.csv?raw'
import scoresData from '../simulation/spreadspoke_scores_2024.csv?raw'

interface Game {
	schedule_date: string
	team_home: string
	team_away: string
	score_home: number
	score_away: number
	schedule_season: number
	schedule_week: number
	over_under_line: number
}

const minWidth = 0
const maxWidth = 1920

const parseGames = (): Game[] => {
	const result = Papa.parse(scoresData, {
		header: true,
		skipEmptyLines: true,
		preview: 500,
		// Add transform callback to parse scores as numbers
		transform: (value, field) => {
			if (field === 'score_home' || field === 'score_away') {
				return parseInt(value) || 0
			}
			// if (field === 'over_under_line') {
			// 	return parseFloat(value) || 0
			// }
			return value
		}
	})
	return result.data as Game[]
}

const games = parseGames()

// Create nodes object where each team is a node
const nodes: Record<string, vNG.Node> = {}

// Track min/max values for scaling
let minWeek = Infinity
let maxWeek = -Infinity
let minSeason = Infinity
let maxSeason = -Infinity
let minLine = Infinity
let maxLine = -Infinity

// First pass - collect min/max values and filter invalid games
// const validGames = games.filter(game => {
// 	const season = game.schedule_season
// 	const week = game.schedule_week
// 	const overUnder = game.over_under_line

// 	// Only track valid values
// 	if (season && week && overUnder) {
// 		if (season < minSeason) minSeason = season
// 		if (season > maxSeason) maxSeason = season
// 		if (week < minWeek) minWeek = week
// 		if (week > maxWeek) maxWeek = week
// 		if (overUnder < minLine) minLine = overUnder
// 		if (overUnder > maxLine) maxLine = overUnder
// 		return true
// 	}
// 	return false
// })

// Safety checks to prevent -Infinity
minSeason = minSeason === Infinity ? 2020 : minSeason
maxSeason = maxSeason === -Infinity ? 2024 : maxSeason
minWeek = minWeek === Infinity ? 1 : minWeek
maxWeek = maxWeek === -Infinity ? 18 : maxWeek
minLine = minLine === Infinity ? 35 : minLine
maxLine = maxLine === -Infinity ? 55 : maxLine

// push base game with week/season instead of date
const overUnder = 56
const baseGame: Game = {
	schedule_date: new Date().toISOString(), // date doesn't matter anymore
	team_home: 'Base Team',
	team_away: 'Base Team',
	score_home: overUnder / 2,
	score_away: overUnder / 2,
	schedule_season: maxSeason,
	schedule_week: maxWeek + 1,
	over_under_line: overUnder
}
games.push(baseGame)

// Helper function to scale a value between a range
const scale = (
	value: number,
	min: number,
	max: number,
	targetMin: number,
	targetMax: number
) => {
	return targetMin + (targetMax - targetMin) * ((value - min) / (max - min))
}

const layouts: vNG.Layouts = {
	nodes: {}
}
let yPos = 1000
let currWeek = 0
// Second pass - create nodes with scaled positions
for (const game of games) {
	const season = game.schedule_season
	const week = game.schedule_week
	const overUnder = game.over_under_line || 0
	const totalScore = Number(game.score_home) + Number(game.score_away)

	const homeTeam = game.team_home.split(' ').pop()
	const awayTeam = game.team_away.split(' ').pop()

	const homeAbbrev =
		NFL_TEAMS.find(team => team.name === homeTeam)?.espnAbbrev || homeTeam
	const awayAbbrev =
		NFL_TEAMS.find(team => team.name === awayTeam)?.espnAbbrev || awayTeam

	// Scale x position based on over/under line (100-700 range)
	const xPos = scale(overUnder, minLine, maxLine, minWidth, maxWidth)

	// Scale y position based on season and week instead of date
	// Each season starts a new section, weeks are positions within season
	// const seasonHeight = 1100 / (maxSeason - minSeason + 1)
	// const weekY = scale(week, minWeek, maxWeek, seasonHeight, 0)
	// const seasonY = (season - minSeason) * seasonHeight
	// const yPos = 100 + seasonY + weekY
	if (week !== currWeek) {
		yPos -= 10
		currWeek = week
	}
	yPos -= 5

	const baseSize = 1

	const nodeId = `${season}-${week}-${game.team_home}-${game.team_away}`
	const nodeSize = baseSize + totalScore / 5
	// const nodeName = `Season ${season} Week ${week}\n${homeAbbrev} vs ${awayAbbrev}\nScore: ${totalScore}\nOver/Under: ${game.over_under_line} \n${nodeSize}`
	const nodeName = `${season}-${week}\n${homeAbbrev} vs ${awayAbbrev}\n${game.over_under_line} | ${totalScore} \n${nodeSize}`
	nodes[nodeId] = {
		id: nodeId,
		name: nodeName,
		size: nodeSize,
		label: `${game.score_home}-${game.score_away}`,
		color: '#1976d2',
		gameInfo: {
			date: game.schedule_date,
			homeTeam: game.team_home,
			awayTeam: game.team_away,
			score: `${game.score_home}-${game.score_away}`,
			overUnder: game.over_under_line
		}
	}

	// Set node position directly instead of using layouts
	if (!layouts.nodes[nodeId]) {
		layouts.nodes[nodeId] = { x: xPos, y: yPos }
	}
}

// Remove edges since we're focusing on individual games
const edges = {}

const configs = reactive(
	vNG.defineConfigs({
		view: {
			scalingObjects: true
		},
		node: {
			normal: {
				type: 'circle',
				radius: node => node.size,
				color: node => node.color
			},
			hover: {
				radius: node => node.size * 1.2,
				color: '#ff4081'
			},
			selectable: true,
			label: {
				visible: true,
				fontSize: 8,
				direction: 'center'
			}
		}
	})
)
</script>

<template>
	<v-network-graph
		class="graph"
		:nodes="nodes"
		:edges="edges"
		:layouts="layouts"
		:configs="configs"
	/>
</template>

<style>
.graph {
	width: 90vw;
	height: 95vh;
	border: 1px solid #000;
	background: #f5f5f5;
}
</style>

<!-- 
TODO:
 
- Add hover effect to show game info
- Add edges
- Add filtering
- Distance separation between nodes when overlapping. Seasons should be all on same level, unless overlapping overunder, then separate by week, then add gap if still not separated

-->
