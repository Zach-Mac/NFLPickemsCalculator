<script setup lang="ts">
const pastedText = useSessionStorage('pastedText', '')

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

const memoryTypes = ['commit', 'workingSet', 'shareable', 'private'] as const
type MemoryType = (typeof memoryTypes)[number]
type MemoryTypes<T> = {
	[key in MemoryType]: T
}
interface ImageMemories extends MemoryTypes<string> {
	name: string
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

const memory = computed(() => {
	const lines = pastedText.value.split('\n')
	const splitted = lines.map(line => line.split(/[\t\s]+/)).slice(1)

	const memorySumsByImage: { [key: string]: MemoryTypes<number> } = {}

	for (const row of splitted) {
		if (row.length < 5) continue

		const image = row[0]

		if (!memorySumsByImage[image]) memorySumsByImage[image] = { ...initialMemory }

		memoryTypes.forEach((type, index) => {
			if (row.length - 1 < index + 3) return

			const value = parseFloat(row[index + 3].replaceAll(',', ''))
			memorySumsByImage[image][type] += value
		})
	}

	const total = { ...initialMemory }

	const output: ImageMemories[] = Object.entries(memorySumsByImage).map(item => {
		memoryTypes.forEach(type => {
			total[type] += item[1][type]
		})

		return {
			name: item[0],
			...transformToString(item[1])
		}
	})
	output.unshift({
		name: 'TOTAL',
		...transformToString(total)
	})

	return output
})

function sortFromString(keyToSortBy: keyof ImageMemories) {
	return (a: ImageMemories, b: ImageMemories) =>
		fromString(a[keyToSortBy]) - fromString(b[keyToSortBy])
}

const tableHeaders = [
	{ title: 'Image Name', value: 'name', width: '60%' },
	{
		title: 'Commit',
		key: 'commit',
		sortRaw: sortFromString('commit'),
		width: '10%'
	},
	{
		title: 'Working Set',
		key: 'workingSet',
		sortRaw: sortFromString('workingSet'),
		width: '10%'
	},
	{
		title: 'Shareable',
		key: 'shareable',
		sortRaw: sortFromString('shareable'),
		width: '10%'
	},
	{
		title: 'Private',
		key: 'private',
		sortRaw: sortFromString('private'),
		width: '10%'
	}
]
</script>

<template>
	<v-container>
		<v-row>
			<v-col>
				<v-textarea v-model="pastedText"></v-textarea>
				<v-data-table
					:headers="tableHeaders"
					:items="memory"
					:items-per-page="50"
				></v-data-table>
			</v-col>
		</v-row>
	</v-container>
</template>
