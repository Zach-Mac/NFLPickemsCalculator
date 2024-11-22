<script setup lang="ts">
import type { DataTableHeader, SortItem } from '~/utils/typesVuetify'

const pastedText = useLocalStorage('pastedText', '')
const listToSum = useLocalStorage('listToSum', '')
const splitter = useLocalStorage('splitter', '\n')

const conversionNum = 1000

function toString(kilobytes: number) {
	if (kilobytes > conversionNum * conversionNum)
		return (kilobytes / conversionNum / conversionNum).toFixed(2) + ' GB'
	if (kilobytes > conversionNum) return (kilobytes / conversionNum).toFixed(2) + ' MB'

	return kilobytes + ' KB'
}
function fromString(memoryString: string) {
	const number = parseFloat(memoryString)
	if (memoryString.endsWith('GB')) return number * conversionNum * conversionNum
	if (memoryString.endsWith('MB')) return number * conversionNum

	return number
}

const sum = computed(() => {
	const values = listToSum.value.split(splitter.value)
	const sum = values.reduce((acc, value) => acc + fromString(value), 0)

	return sum
})
const sumString = computed(() => toString(sum.value))

const memoryTypes = ['commit', 'workingSet', 'shareable', 'private'] as const
type MemoryType = (typeof memoryTypes)[number]
type MemoryTypes<T> = {
	[key in MemoryType]: T
}
interface SortableImageNoKids extends MemoryTypes<string> {
	name: string
}
interface ImageMemory extends MemoryTypes<string> {
	name: string
	subProcesses?: SortableImageNoKids[]
}

// Initialize the memory object with 0 for each type
const initialMemory: MemoryTypes<number> = memoryTypes.reduce(
	(acc, type) => ({ ...acc, [type]: 0 }),
	{} as MemoryTypes<number>
)

// Helper function to transform an object of numbers into an object of strings
function transformToString(obj: MemoryTypes<number>): MemoryTypes<string> {
	return memoryTypes.reduce(
		(acc, type) => ({ ...acc, [type]: toString(obj[type]) }),
		{} as MemoryTypes<string>
	)
}

const totals = ref<MemoryTypes<number | string>>({ ...initialMemory })

const memory = computed(() => {
	const lines = pastedText.value.split('\n')
	const splitted = lines.map(line => line.split(/[\t\s]+/)).slice(1)

	const memorySumsByImage: { [key: string]: MemoryTypes<number> } = {}
	const subProcessesByImage: { [key: string]: SortableImageNoKids[] } = {}

	for (const row of splitted) {
		if (row.length < 5) continue

		const image = row[0]
		const PID = row[1]

		if (!memorySumsByImage[image]) memorySumsByImage[image] = { ...initialMemory }
		if (!subProcessesByImage[image]) subProcessesByImage[image] = []

		memoryTypes.forEach((type, index) => {
			if (row.length - 1 < index + 3) return

			const value = parseFloat(row[index + 3].replaceAll(',', ''))
			memorySumsByImage[image][type] += value
		})

		// Create subProcess object
		const subProcessMemory: MemoryTypes<number> = {} as MemoryTypes<number>
		memoryTypes.forEach((type, index) => {
			if (row.length - 1 < index + 3) return
			const value = parseFloat(row[index + 3].replaceAll(',', ''))
			subProcessMemory[type] = value
		})
		const subProcess: SortableImageNoKids = {
			name: PID,
			...transformToString(subProcessMemory)
		}
		subProcessesByImage[image].push(subProcess)
	}

	const total = { ...initialMemory }

	const output: ImageMemory[] = Object.entries(memorySumsByImage).map(
		([imageName, memorySums]) => {
			memoryTypes.forEach(type => {
				total[type] += memorySums[type]
			})

			return {
				name: imageName,
				...transformToString(memorySums),
				subProcesses: subProcessesByImage[imageName]
			}
		}
	)
	totals.value = { ...transformToString(total) }

	console.log('output', output)

	return output
})

function sortFromString(keyToSortBy: keyof SortableImageNoKids) {
	return (a: ImageMemory, b: ImageMemory) =>
		fromString(b[keyToSortBy]) - fromString(a[keyToSortBy])
}

const baseHeaders: DataTableHeader = [
	{
		title: 'Commit',
		key: 'commit',
		sortRaw: sortFromString('commit'),
		maxWidth: '1%',
		nowrap: true
	},
	{
		title: 'Working Set',
		key: 'workingSet',
		sortRaw: sortFromString('workingSet'),
		maxWidth: '1%',
		nowrap: true
	},
	{
		title: 'Shareable',
		key: 'shareable',
		sortRaw: sortFromString('shareable'),
		maxWidth: '1%',
		nowrap: true
	},
	{
		title: 'Private',
		key: 'private',
		sortRaw: sortFromString('private'),
		maxWidth: '1%',
		nowrap: true
	}
]
const tableHeaders: DataTableHeader = [
	{
		title: 'Image Name',
		value: 'name',
		maxWidth: '30%',
		nowrap: true
	},
	...baseHeaders,
	{ title: '', key: 'data-table-expand', width: '1%' }
]
const subProcessesHeaders: DataTableHeader = [
	{ title: '', width: '100%' },
	{ title: 'PID', value: 'name' },
	...baseHeaders
]

const selected = ref<string[]>([])
const selectedTotals = computed(() => {
	const total: MemoryTypes<number> = { ...initialMemory }
	selected.value.forEach(imageName => {
		const image = memory.value.find(image => image.name === imageName)
		if (!image) return

		memoryTypes.forEach(type => {
			total[type] += fromString(image[type])
		})
	})

	return transformToString(total)
})

const currentItems = ref<any[]>([])

const currentItemsNames = computed(() => currentItems.value.map(item => item.columns.name))
const currentItemsTotals = computed(() => {
	const total: MemoryTypes<number> = { ...initialMemory }
	currentItemsNames.value.forEach(imageName => {
		const image = memory.value.find(image => image.name === imageName)
		if (!image) return

		memoryTypes.forEach(type => {
			total[type] += fromString(image[type])
		})
	})

	return transformToString(total)
})

const sortBy: Ref<SortItem[]> = ref([])
</script>

<template>
	<v-container>
		<v-row>
			<v-col cols="12" xl="8" class="mx-auto">
				<v-textarea v-model="pastedText"></v-textarea>
				<v-row>
					<v-col cols="auto" class="mx-auto">
						<v-data-table
							v-model="selected"
							:headers="tableHeaders"
							:items="memory"
							item-value="name"
							:items-per-page="25"
							:sort-by="sortBy"
							@update:sort-by="sortBy = $event"
							@update:current-items="currentItems = $event"
							show-select
							hover
							density="compact"
							sort-asc-icon="$sortDesc"
							sort-desc-icon="$sortAsc"
							class="smallButtons"
						>
							<template v-slot:expanded-row="{ columns, item }">
								<tr>
									<td :colspan="columns.length">
										<v-data-table
											:headers="subProcessesHeaders"
											:items="item.subProcesses"
											:hide-default-footer="true"
											:sort-by="sortBy"
											hover
											density="compact"
											sort-asc-icon="$sortDesc"
											sort-desc-icon="$sortAsc"
										></v-data-table>
									</td>
								</tr>
							</template>
							<template v-slot:body.append>
								<tr class="text-no-wrap">
									<td></td>
									<td class="font-weight-bold">Selected Totals</td>
									<td class="font-weight-bold" v-for="type of memoryTypes">
										{{ selectedTotals[type] }}
									</td>
									<td></td>
								</tr>
								<tr class="text-no-wrap">
									<td></td>
									<td class="font-weight-bold">Current Items Totals</td>
									<td class="font-weight-bold" v-for="type of memoryTypes">
										{{ currentItemsTotals[type] }}
									</td>
									<td></td>
								</tr>
								<tr class="text-no-wrap">
									<td></td>
									<td class="font-weight-bold">Totals</td>
									<td class="font-weight-bold" v-for="type of memoryTypes">
										{{ totals[type] }}
									</td>
									<td></td>
								</tr>
							</template>
						</v-data-table>
					</v-col>
				</v-row>

				<v-textarea v-model="listToSum" label="List of memory values to sum" />
				<v-text-field v-model="splitter" label="Splitter" />
				{{ sum }} KB
				<br />
				{{ sumString }}
			</v-col>
		</v-row>
	</v-container>
</template>

<style>
.smallButtons .v-btn.v-btn--size-small,
.smallButtons .v-selection-control__wrapper {
	height: 25px;
}
</style>
