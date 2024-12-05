import { useStorage } from '@vueuse/core'

export interface PlayerItem {
	rank: number
	name: string
	picks: string[]
	weekTotal: number
	seasonTotal: number
	tieBreaker: number
	nfeloWinChance: number
	espnWinChance: number
	winningOutcomesPercent: number
	seasonPrizeChance: number
	chanceMake100: number
	seasonEv: number
	evChange: number
}
export type HeaderKey = keyof PlayerItem

type Header = {
	key: HeaderKey
	value: HeaderKey
	title: string
	subtitle?: string
	sortable: boolean
}

const baseHeaders: Header[] = [
	{ key: 'rank', title: 'Rank', value: 'rank', sortable: false },
	{ key: 'name', title: 'Name', value: 'name', sortable: true },
	{ key: 'weekTotal', title: 'Week Total', value: 'weekTotal', sortable: true },
	{ key: 'seasonTotal', title: 'Season Total', value: 'seasonTotal', sortable: true },
	{ key: 'tieBreaker', title: 'Tie Breaker', value: 'tieBreaker', sortable: true }
]
const optionalHeadersItems: Header[] = [
	{
		key: 'nfeloWinChance',
		value: 'nfeloWinChance',
		title: 'nfelo Win %',
		subtitle: 'Chance of winning based on nfelo predictions',
		sortable: true
	},
	{
		key: 'espnWinChance',
		value: 'espnWinChance',
		title: 'ESPN Win %',
		subtitle: 'Chance of winning based on ESPN predictions',
		sortable: true
	},
	{
		key: 'winningOutcomesPercent',
		value: 'winningOutcomesPercent',
		title: 'Win Outcomes %',
		subtitle: 'Percentage of winning outcomes with selected game winners',
		sortable: true
	},
	{
		key: 'seasonPrizeChance',
		value: 'seasonPrizeChance',
		title: 'Season Prize %',
		subtitle: 'Chance to win money at end of season',
		sortable: true
	},
	{
		key: 'chanceMake100',
		value: 'chanceMake100',
		title: 'Chance $100',
		subtitle: 'Chance to win $100 or more at end of season',
		sortable: true
	},
	{
		key: 'seasonEv',
		value: 'seasonEv',
		title: 'Season EV',
		subtitle: 'Expected season winnings based on selected winners (in $)',
		sortable: true
	},
	{
		key: 'evChange',
		value: 'evChange',
		title: 'EV Δ',
		subtitle: 'Difference in expected season winnings from last week (in $)',
		sortable: true
	}
]
const headers = baseHeaders.concat(optionalHeadersItems)

type SettingsValue = 'highlightTiedRows' | 'lockFinishedGames'
const settingsItems = [
	{
		title: 'Highlight tied rows',
		subtitle: 'Highlight tied rows in the table',
		value: 'highlightTiedRows' as SettingsValue
	},
	{
		title: 'Lock finished games',
		subtitle: 'Disable editing of games that have already finished',
		value: 'lockFinishedGames' as SettingsValue
	}
]

export const useTableStore = defineStore('table', () => {
	const picksStore = usePicksStore()
	const weekOutcomesStore = useWeekOutcomesStore()

	const editGamesMode = ref(false)

	const optionalColumnsSelection = useStorage('optionalHeadersSelection', [
		'nfeloWinChance',
		'espnWinChance',
		'winningOutcomesPercent',
		'seasonPrizeChance',
		'chanceMake100',
		'seasonEv',
		'evChange'
	] as HeaderKey[])
	const optionalColumns = computed(() => {
		return Object.fromEntries(
			optionalHeadersItems.map(item => [
				item.value,
				optionalColumnsSelection.value.includes(item.value)
			])
		) as Record<HeaderKey, boolean>
	})

	const settingsSelection = useStorage('settingsSelection', [
		'highlightTiedRows'
	] as SettingsValue[])

	const settings = computed(() => {
		return Object.fromEntries(
			settingsItems.map(item => [item.value, settingsSelection.value.includes(item.value)])
		) as Record<SettingsValue, boolean>
	})

	function getHeaderTitle(key: HeaderKey) {
		return headers.find(header => header.key === key)?.title || key
	}
	function getHeaderSubtitle(key: HeaderKey) {
		return headers.find(header => header.key === key)?.subtitle || ''
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
		espnWinChance: [{ key: 'espnWinChance', order: 'desc' }],
		winningOutcomesPercent: [{ key: 'winningOutcomesPercent', order: 'desc' }],
		seasonPrizeChance: [{ key: 'seasonPrizeChance', order: 'desc' }],
		chanceMake100: [{ key: 'chanceMake100', order: 'desc' }],
		seasonEv: [{ key: 'seasonEv', order: 'desc' }],
		evChange: [{ key: 'evChange', order: 'desc' }],
		rank: [],
		picks: []
	}
	const sortBy = ref(sortByOptions.weekTotal)

	const items = computed<PlayerItem[]>(() => {
		return picksStore.picksData.map(playerPicks => {
			return {
				rank: 0,
				name: playerPicks.name,
				picks: playerPicks.picks,
				weekTotal: picksStore.playerTotals[playerPicks.name]?.weekTotal || 0,
				seasonTotal: picksStore.playerTotals[playerPicks.name]?.seasonTotal || 0,
				tieBreaker: playerPicks.tieBreaker,
				nfeloWinChance:
					weekOutcomesStore.liveStatsComputed[playerPicks.name]?.nfeloChance || 0,
				espnWinChance:
					weekOutcomesStore.liveStatsComputed[playerPicks.name]?.espnChance || 0,
				winningOutcomesPercent:
					weekOutcomesStore.liveStatsComputed[playerPicks.name]?.winningOutcomesPercent ||
					0,
				seasonPrizeChance: picksStore.seasonEvs?.[playerPicks.name]?.chance || 0,
				chanceMake100: picksStore.seasonEvs?.[playerPicks.name]?.chanceOver100 || 0,
				seasonEv: picksStore.seasonEvs?.[playerPicks.name]?.money || 0,
				evChange: picksStore.seasonEvsChange?.[playerPicks.name] || 0
			}
		})
	})

	return {
		settings,
		settingsSelection,
		settingsItems,
		optionalColumns,
		optionalColumnsSelection,
		optionalHeadersItems,
		items,
		headers,
		editGamesMode,
		getHeaderTitle,
		getHeaderSubtitle,
		sortByOptions,
		sortBy
	}
})

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useTableStore, import.meta.hot))
}
