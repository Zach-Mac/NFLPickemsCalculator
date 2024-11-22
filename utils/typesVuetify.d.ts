import type { UnwrapRef, FunctionalComponent } from 'vue'
import { VDataTable } from 'vuetify/components'

export type SelectItemKey<T = Record<string, any>> =
	| boolean
	| null
	| undefined // Ignored
	| string // Lookup by key, can use dot notation for nested objects
	| readonly (string | number)[] // Nested lookup by key, each array item is a key in the next level
	| ((item: T, fallback?: any) => any)

export type DataTableHeader = VDataTable['$props']['headers']

// export type DataTableHeader<T = Record<string, any>> = {
// 	key?: (string & {}) | 'data-table-group' | 'data-table-select' | 'data-table-expand' | undefined
// 	value?: SelectItemKey<any>
// 	title?: string | undefined
// 	fixed?: boolean | undefined
// 	align?: 'start' | 'end' | 'center' | undefined
// 	width?: string | number | undefined
// 	minWidth?: string | undefined
// 	maxWidth?: string | undefined
// 	nowrap?: boolean | undefined
// 	headerProps?: { [x: string]: any } | undefined
// 	cellProps?:
// 		| { [x: string]: any }
// 		| ((
// 				data: Pick<ItemKeySlot<any>, 'value' | 'item' | 'index' | 'internalItem'>
// 		  ) => Record<string, any>)
// 		| undefined
// 	sortable?: boolean | undefined
// 	sort?: DataTableCompareFunction<any> | undefined
// 	sortRaw?: DataTableCompareFunction<any> | undefined
// 	filter?: FilterFunction | undefined
// 	mobile?: boolean | undefined
// 	children?: any[] | undefined
// }

export type InternalDataTableHeader = Omit<DataTableHeader, 'key' | 'value' | 'children'> & {
	key: string | null
	value: SelectItemKey | null
	sortable: boolean
	fixedOffset?: number
	lastFixed?: boolean
	nowrap?: boolean
	colspan?: number
	rowspan?: number
	children?: InternalDataTableHeader[]
}

// interface HeadersSlotProps {
// 	headers: InternalDataTableHeader[][]
// 	columns: InternalDataTableHeader[]
// 	sortBy: UnwrapRef<ReturnType<typeof provideSort>['sortBy']>
// 	// someSelected: UnwrapRef<ReturnType<typeof provideSelection>['someSelected']>
// 	// allSelected: UnwrapRef<ReturnType<typeof provideSelection>['allSelected']>
// 	someSelected: boolean
// 	allSelected: boolean
// 	toggleSort: ReturnType<typeof provideSort>['toggleSort']
// 	// selectAll: ReturnType<typeof provideSelection>['selectAll']
// 	selectAll: (value: boolean) => void
// 	getSortIcon: (column: InternalDataTableHeader) => IconValue
// 	isSorted: ReturnType<typeof provideSort>['isSorted']
// }
export interface HeadersSlotProps {
	headers: InternalDataTableHeader[][]
	columns: InternalDataTableHeader[]
	sortBy: UnwrapRef<ReturnType<typeof provideSort>['sortBy']>
	someSelected: boolean
	allSelected: boolean
	toggleSort: ReturnType<typeof provideSort>['toggleSort']
	selectAll: (value: boolean) => void
	getSortIcon: (column: InternalDataTableHeader) => IconValue
	isSorted: ReturnType<typeof provideSort>['isSorted']
}

export type JSXComponent<Props = any> =
	| { new (): ComponentPublicInstance<Props> }
	| FunctionalComponent<Props>

export type IconValue = string | (string | [path: string, opacity: number])[] | JSXComponent

export type SortItem = { key: string; order?: boolean | 'asc' | 'desc' }
function provideSort(options: {
	sortBy: Ref<readonly SortItem[]>
	mustSort: Ref<boolean>
	multiSort: Ref<boolean>
	page?: Ref<number>
}) {
	const { sortBy, mustSort, multiSort, page } = options

	const toggleSort = (column: InternalDataTableHeader) => {
		if (column.key == null) return

		let newSortBy = sortBy.value.map(x => ({ ...x })) ?? []
		const item = newSortBy.find(x => x.key === column.key)

		if (!item) {
			if (multiSort.value) newSortBy = [...newSortBy, { key: column.key, order: 'asc' }]
			else newSortBy = [{ key: column.key, order: 'asc' }]
		} else if (item.order === 'desc') {
			if (mustSort.value) {
				item.order = 'asc'
			} else {
				newSortBy = newSortBy.filter(x => x.key !== column.key)
			}
		} else {
			item.order = 'desc'
		}

		sortBy.value = newSortBy
		if (page) page.value = 1
	}

	function isSorted(column: InternalDataTableHeader) {
		return !!sortBy.value.find(item => item.key === column.key)
	}

	const data = { sortBy, toggleSort, isSorted }

	// provide(VDataTableSortSymbol, data)

	return data
}

//   function provideSelection (
//     props: SelectionProps,
//     { allItems, currentPage }: { allItems: Ref<SelectableItem[]>, currentPage: Ref<SelectableItem[]> }
//   ) {
//     const selected = useProxiedModel(props, 'modelValue', props.modelValue, v => {
//       return new Set(wrapInArray(v).map(v => {
//         return allItems.value.find(item => props.valueComparator(v, item.value))?.value ?? v
//       }))
//     }, v => {
//       return [...v.values()]
//     })

//     const allSelectable = computed(() => allItems.value.filter(item => item.selectable))
//     const currentPageSelectable = computed(() => currentPage.value.filter(item => item.selectable))

//     const selectStrategy = computed(() => {
//       if (typeof props.selectStrategy === 'object') return props.selectStrategy

//       switch (props.selectStrategy) {
//         case 'single': return singleSelectStrategy
//         case 'all': return allSelectStrategy
//         case 'page':
//         default: return pageSelectStrategy
//       }
//     })

//     function isSelected (items: SelectableItem | SelectableItem[]) {
//       return wrapInArray(items).every(item => selected.value.has(item.value))
//     }

//     function isSomeSelected (items: SelectableItem | SelectableItem[]) {
//       return wrapInArray(items).some(item => selected.value.has(item.value))
//     }

//     function select (items: SelectableItem[], value: boolean) {
//       const newSelected = selectStrategy.value.select({
//         items,
//         value,
//         selected: new Set(selected.value),
//       })

//       selected.value = newSelected
//     }

//     function toggleSelect (item: SelectableItem) {
//       select([item], !isSelected([item]))
//     }

//     function selectAll (value: boolean) {
//       const newSelected = selectStrategy.value.selectAll({
//         value,
//         allItems: allSelectable.value,
//         currentPage: currentPageSelectable.value,
//         selected: new Set(selected.value),
//       })

//       selected.value = newSelected
//     }

//     const someSelected = computed(() => selected.value.size > 0)
//     const allSelected = computed(() => {
//       const items = selectStrategy.value.allSelected({
//         allItems: allSelectable.value,
//         currentPage: currentPageSelectable.value,
//       })
//       return !!items.length && isSelected(items)
//     })
//     const showSelectAll = computed(() => selectStrategy.value.showSelectAll)

//     const data = {
//       toggleSelect,
//       select,
//       selectAll,
//       isSelected,
//       isSomeSelected,
//       someSelected,
//       allSelected,
//       showSelectAll,
//     }

//     provide(VDataTableSelectionSymbol, data)

//     return data
//   }
