export interface PlayerItem {
	name: string
	picks: string[]
	weekTotal: number
	seasonTotal: number
	tieBreaker: number
	nfeloWinChance: number
	winningOutcomesPercent: number
	seasonEv: number
	evChange: number
}
export type HeaderKey = keyof PlayerItem

export const useTableStore = defineStore('table', () => {
	const editGamesMode = ref(false)

	const headers = ref([
		{ key: 'rank', title: 'Rank', value: 'rank', sortable: false },
		{ key: 'name', title: 'Name', value: 'name', sortable: true },
		{ key: 'weekTotal', title: 'WeekTotal', value: 'weekTotal', sortable: true },
		{ key: 'seasonTotal', title: 'SeasonTotal', value: 'seasonTotal', sortable: true },
		{ key: 'tieBreaker', title: 'TieBreaker', value: 'tieBreaker', sortable: true },
		{ key: 'nfeloWinChance', title: 'nfeloWinChance', value: 'nfeloWinChance', sortable: true },
		{
			key: 'winningOutcomesPercent',
			title: 'winningOutcomesPercent',
			value: 'winningOutcomesPercent',
			sortable: true
		},
		{ key: 'seasonEv', title: 'SeasonEV', value: 'seasonEv', sortable: true },
		{ key: 'evChange', title: 'EV Change', value: 'evChange', sortable: true }
	])

	interface SortBy {
		key: HeaderKey
		order: boolean | 'desc' | 'asc' | undefined
	}
	const sortByOptions: Record<string, SortBy[]> = {
		weekTotal: [
			{ key: 'weekTotal', order: 'desc' },
			{ key: 'tieBreaker', order: 'asc' }
		],
		seasonTotal: [
			{ key: 'seasonTotal', order: 'desc' },
			{ key: 'tieBreaker', order: 'asc' }
		],
		tieBreaker: [{ key: 'tieBreaker', order: 'desc' }],
		name: [{ key: 'name', order: 'asc' }],
		nfeloWinChance: [{ key: 'nfeloWinChance', order: 'desc' }],
		winningOutcomesPercent: [{ key: 'winningOutcomesPercent', order: 'desc' }],
		seasonEv: [{ key: 'seasonEv', order: 'desc' }],
		evChange: [{ key: 'evChange', order: 'desc' }]
	}
	const sortBy = ref(sortByOptions.weekTotal)

	return {
		editGamesMode,
		headers,
		sortByOptions,
		sortBy
	}
})
