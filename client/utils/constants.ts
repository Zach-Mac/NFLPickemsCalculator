export const GAME_FILTERS = {
	ALL: 'all',
	NOTSTARTED: 'notstarted',
	UNFINISHED: 'unfinished',
	NOWINNERS: 'nowinners'
}

export enum GameStateEnum {
	PRE = 'pre',
	POST = 'post',
	IN = 'in'
}

export const NFL_TEAM_NAMES = [
	'49ers',
	'Bears',
	'Bengals',
	'Bills',
	'Broncos',
	'Browns',
	'Buccaneers',
	'Cardinals',
	'Chargers',
	'Chiefs',
	'Colts',
	'Commanders',
	'Cowboys',
	'Dolphins',
	'Eagles',
	'Falcons',
	'Giants',
	'Jaguars',
	'Jets',
	'Lions',
	'Packers',
	'Panthers',
	'Patriots',
	'Raiders',
	'Rams',
	'Ravens',
	'Saints',
	'Seahawks',
	'Steelers',
	'Texans',
	'Titans',
	'Vikings'
]

export const NFL_TEAMS = [
	{ name: '49ers', poolhostAbbrev: 'SF', espnAbbrev: 'SF', nfeloAbbrev: 'SF' },
	{ name: 'Bears', poolhostAbbrev: 'CHI', espnAbbrev: 'CHI', nfeloAbbrev: 'CHI' },
	{ name: 'Bengals', poolhostAbbrev: 'CIN', espnAbbrev: 'CIN', nfeloAbbrev: 'CIN' },
	{ name: 'Bills', poolhostAbbrev: 'BUF', espnAbbrev: 'BUF', nfeloAbbrev: 'BUF' },
	{ name: 'Broncos', poolhostAbbrev: 'DEN', espnAbbrev: 'DEN', nfeloAbbrev: 'DEN' },
	{ name: 'Browns', poolhostAbbrev: 'CLE', espnAbbrev: 'CLE', nfeloAbbrev: 'CLE' },
	{ name: 'Buccaneers', poolhostAbbrev: 'TB', espnAbbrev: 'TB', nfeloAbbrev: 'TB' },
	{ name: 'Cardinals', poolhostAbbrev: 'AZ', espnAbbrev: 'ARI', nfeloAbbrev: 'ARI' },
	{ name: 'Chargers', poolhostAbbrev: 'LAC', espnAbbrev: 'LAC', nfeloAbbrev: 'LAC' },
	{ name: 'Chiefs', poolhostAbbrev: 'KC', espnAbbrev: 'KC', nfeloAbbrev: 'KC' },
	{ name: 'Colts', poolhostAbbrev: 'IND', espnAbbrev: 'IND', nfeloAbbrev: 'IND' },
	{ name: 'Commanders', poolhostAbbrev: 'WAS', espnAbbrev: 'WSH', nfeloAbbrev: 'WAS' },
	{ name: 'Cowboys', poolhostAbbrev: 'DAL', espnAbbrev: 'DAL', nfeloAbbrev: 'DAL' },
	{ name: 'Dolphins', poolhostAbbrev: 'MIA', espnAbbrev: 'MIA', nfeloAbbrev: 'MIA' },
	{ name: 'Eagles', poolhostAbbrev: 'PHI', espnAbbrev: 'PHI', nfeloAbbrev: 'PHI' },
	{ name: 'Falcons', poolhostAbbrev: 'ATL', espnAbbrev: 'ATL', nfeloAbbrev: 'ATL' },
	{ name: 'Giants', poolhostAbbrev: 'NYG', espnAbbrev: 'NYG', nfeloAbbrev: 'NYG' },
	{ name: 'Jaguars', poolhostAbbrev: 'JAC', espnAbbrev: 'JAX', nfeloAbbrev: 'JAX' },
	{ name: 'Jets', poolhostAbbrev: 'NYJ', espnAbbrev: 'NYJ', nfeloAbbrev: 'NYJ' },
	{ name: 'Lions', poolhostAbbrev: 'DET', espnAbbrev: 'DET', nfeloAbbrev: 'DET' },
	{ name: 'Packers', poolhostAbbrev: 'GB', espnAbbrev: 'GB', nfeloAbbrev: 'GB' },
	{ name: 'Panthers', poolhostAbbrev: 'CAR', espnAbbrev: 'CAR', nfeloAbbrev: 'CAR' },
	{ name: 'Patriots', poolhostAbbrev: 'NE', espnAbbrev: 'NE', nfeloAbbrev: 'NE' },
	{ name: 'Raiders', poolhostAbbrev: 'LV', espnAbbrev: 'LV', nfeloAbbrev: 'LV' },
	{ name: 'Rams', poolhostAbbrev: 'LAR', espnAbbrev: 'LAR', nfeloAbbrev: 'LAR' },
	{ name: 'Ravens', poolhostAbbrev: 'BAL', espnAbbrev: 'BAL', nfeloAbbrev: 'BAL' },
	{ name: 'Saints', poolhostAbbrev: 'NO', espnAbbrev: 'NO', nfeloAbbrev: 'NO' },
	{ name: 'Seahawks', poolhostAbbrev: 'SEA', espnAbbrev: 'SEA', nfeloAbbrev: 'SEA' },
	{ name: 'Steelers', poolhostAbbrev: 'PIT', espnAbbrev: 'PIT', nfeloAbbrev: 'PIT' },
	{ name: 'Texans', poolhostAbbrev: 'HOU', espnAbbrev: 'HOU', nfeloAbbrev: 'HOU' },
	{ name: 'Titans', poolhostAbbrev: 'TEN', espnAbbrev: 'TEN', nfeloAbbrev: 'TEN' },
	{ name: 'Vikings', poolhostAbbrev: 'MIN', espnAbbrev: 'MIN', nfeloAbbrev: 'MIN' }
]

export const POOLHOST_TO_ESPN_ABBREVIATION = {
	AZ: 'ARI',
	ATL: 'ATL',
	BAL: 'BAL',
	BUF: 'BUF',
	CAR: 'CAR',
	CHI: 'CHI',
	CIN: 'CIN',
	CLE: 'CLE',
	DAL: 'DAL',
	DEN: 'DEN',
	DET: 'DET',
	GB: 'GB',
	HOU: 'HOU',
	IND: 'IND',
	JAC: 'JAX',
	KC: 'KC',
	LAC: 'LAC',
	LAR: 'LAR',
	LV: 'LV',
	MIA: 'MIA',
	MIN: 'MIN',
	NE: 'NE',
	NO: 'NO',
	NYG: 'NYG',
	NYJ: 'NYJ',
	PHI: 'PHI',
	PIT: 'PIT',
	SEA: 'SEA',
	SF: 'SF',
	TB: 'TB',
	TEN: 'TEN',
	WAS: 'WSH'
}
export type PoolhostTeamAbbreviation = keyof typeof POOLHOST_TO_ESPN_ABBREVIATION

export const NFL_GAMES_PER_WEEK = [
	16, 16, 16, 16, 14, 14, 15, 16, 15, 14, 14, 13, 16, 13, 16, 16, 16, 16, 6, 4, 2, 1
]
