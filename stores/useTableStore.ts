import { useStorage } from '@vueuse/core'

export interface PlayerItem {
	name: string
	picks: string[]
	weekTotal: number
	seasonTotal: number
	tieBreaker: number
	nfeloWinChance: number
	winningOutcomesPercent: number
	seasonPrizeChance: number
	chanceMake100: number
	seasonEv: number
	evChange: number
}
export type HeaderKey = keyof PlayerItem

const headers = [
	{ key: 'rank', title: 'Rank', value: 'rank', sortable: false },
	{ key: 'name', title: 'Name', value: 'name', sortable: true },
	{ key: 'weekTotal', title: 'Week Total', value: 'weekTotal', sortable: true },
	{ key: 'seasonTotal', title: 'Season Total', value: 'seasonTotal', sortable: true },
	{ key: 'tieBreaker', title: 'Tie Breaker', value: 'tieBreaker', sortable: true },
	{
		key: 'nfeloWinChance',
		title: 'nfelo Win %',
		value: 'nfeloWinChance',
		sortable: true
	},
	{
		key: 'winningOutcomesPercent',
		title: 'Winning Outcomes %',
		value: 'winningOutcomesPercent',
		sortable: true
	},
	{
		key: 'seasonPrizeChance',
		title: 'Season Prize %',
		value: 'seasonPrizeChance',
		sortable: true
	},
	{
		key: 'chanceMake100',
		title: 'Chance $100',
		value: 'chanceMake100',
		sortable: true
	},
	{ key: 'seasonEv', title: 'Season EV', value: 'seasonEv', sortable: true },
	{ key: 'evChange', title: 'EV Δ', value: 'evChange', sortable: true }
]

const headerTooltips: Partial<Record<HeaderKey, string>> = {
	nfeloWinChance: 'Chance of winning based on nfelo predictions',
	winningOutcomesPercent: 'Percentage of winning outcomes with selected game winners',
	seasonPrizeChance: 'Chance to win money at end of season',
	chanceMake100: 'Chance to win $100 or more at end of season',
	seasonEv: 'Expected season winnings based on selected winners (in $)',
	evChange: 'Difference in expected season winnings from last week (in $)'
}

export const useTableStore = defineStore('table', () => {
	const editGamesMode = ref(false)
	// const showOptionalColumns = ref({
	// 	nfeloWinChance: true,
	// 	winningOutcomesPercent: true,
	// 	seasonPrizeChance: true,
	// 	chanceMake100: true,
	// 	seasonEv: true,
	// 	evChange: true
	// } as Record<HeaderKey, boolean>)
	const showOptionalColumns: Ref<Partial<Record<HeaderKey, boolean>>> = useStorage(
		'showOptionalColumns',
		{
			nfeloWinChance: true,
			winningOutcomesPercent: true,
			seasonPrizeChance: true,
			chanceMake100: true,
			seasonEv: true,
			evChange: true
		}
	)

	function getHeaderTitle(key: HeaderKey) {
		return headers.find(header => header.key === key)?.title || key
	}

	interface SortBy {
		key: HeaderKey
		order: boolean | 'desc' | 'asc' | undefined
	}
	const sortByOptions: Record<HeaderKey, SortBy[]> = {
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
		seasonPrizeChance: [{ key: 'seasonPrizeChance', order: 'desc' }],
		chanceMake100: [{ key: 'chanceMake100', order: 'desc' }],
		seasonEv: [{ key: 'seasonEv', order: 'desc' }],
		evChange: [{ key: 'evChange', order: 'desc' }],
		picks: []
	}
	const sortBy = ref(sortByOptions.weekTotal)

	return {
		headers,
		headerTooltips,
		showOptionalColumns,
		editGamesMode,
		getHeaderTitle,
		sortByOptions,
		sortBy
	}
})
