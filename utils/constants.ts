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
	{ name: '49ers', poohostAbbrev: 'SF', espnAbbrev: 'SF' },
	{ name: 'Bears', poohostAbbrev: 'CHI', espnAbbrev: 'CHI' },
	{ name: 'Bengals', poohostAbbrev: 'CIN', espnAbbrev: 'CIN' },
	{ name: 'Bills', poohostAbbrev: 'BUF', espnAbbrev: 'BUF' },
	{ name: 'Broncos', poohostAbbrev: 'DEN', espnAbbrev: 'DEN' },
	{ name: 'Browns', poohostAbbrev: 'CLE', espnAbbrev: 'CLE' },
	{ name: 'Buccaneers', poohostAbbrev: 'TB', espnAbbrev: 'TB' },
	{ name: 'Cardinals', poohostAbbrev: 'AZ', espnAbbrev: 'ARI' },
	{ name: 'Chargers', poohostAbbrev: 'LAC', espnAbbrev: 'LAC' },
	{ name: 'Chiefs', poohostAbbrev: 'KC', espnAbbrev: 'KC' },
	{ name: 'Colts', poohostAbbrev: 'IND', espnAbbrev: 'IND' },
	{ name: 'Commanders', poohostAbbrev: 'WAS', espnAbbrev: 'WSH' },
	{ name: 'Cowboys', poohostAbbrev: 'DAL', espnAbbrev: 'DAL' },
	{ name: 'Dolphins', poohostAbbrev: 'MIA', espnAbbrev: 'MIA' },
	{ name: 'Eagles', poohostAbbrev: 'PHI', espnAbbrev: 'PHI' },
	{ name: 'Falcons', poohostAbbrev: 'ATL', espnAbbrev: 'ATL' },
	{ name: 'Giants', poohostAbbrev: 'NYG', espnAbbrev: 'NYG' },
	{ name: 'Jaguars', poohostAbbrev: 'JAC', espnAbbrev: 'JAX' },
	{ name: 'Jets', poohostAbbrev: 'NYJ', espnAbbrev: 'NYJ' },
	{ name: 'Lions', poohostAbbrev: 'DET', espnAbbrev: 'DET' },
	{ name: 'Packers', poohostAbbrev: 'GB', espnAbbrev: 'GB' },
	{ name: 'Panthers', poohostAbbrev: 'CAR', espnAbbrev: 'CAR' },
	{ name: 'Patriots', poohostAbbrev: 'NE', espnAbbrev: 'NE' },
	{ name: 'Raiders', poohostAbbrev: 'LV', espnAbbrev: 'LV' },
	{ name: 'Rams', poohostAbbrev: 'LAR', espnAbbrev: 'LAR' },
	{ name: 'Ravens', poohostAbbrev: 'BAL', espnAbbrev: 'BAL' },
	{ name: 'Saints', poohostAbbrev: 'NO', espnAbbrev: 'NO' },
	{ name: 'Seahawks', poohostAbbrev: 'SEA', espnAbbrev: 'SEA' },
	{ name: 'Steelers', poohostAbbrev: 'PIT', espnAbbrev: 'PIT' },
	{ name: 'Texans', poohostAbbrev: 'HOU', espnAbbrev: 'HOU' },
	{ name: 'Titans', poohostAbbrev: 'TEN', espnAbbrev: 'TEN' },
	{ name: 'Vikings', poohostAbbrev: 'MIN', espnAbbrev: 'MIN' }
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
	16, 16, 16, 16, 14, 14, 15, 16, 15, 14, 14, 13, 16, 13, 16, 16, 16, 16
]
