<script setup lang="ts">
const { current } = useMagicKeys()

const baseUrl = 'https://www.teamrankings.com/nfl/stat/'
const urlEndings = {
	passingYards: {
		team: 'passing-yards-per-game',
		opponent: 'opponent-passing-yards-per-game'
	},
	completions: {
		team: 'completions-per-game',
		opponent: 'opponent-completions-per-game'
	},
	passingTds: {
		team: 'passing-touchdowns-per-game',
		opponent: 'opponent-passing-touchdowns-per-game'
	},
	rushingYards: {
		team: 'rushing-yards-per-game',
		opponent: 'opponent-rushing-yards-per-game'
	},
	sacks: {
		team: 'sacks-per-game',
		opponent: 'qb-sacked-per-game'
	}
}
type UrlEndings = typeof urlEndings
type UrlEndingsKeys = keyof UrlEndings

const items = Object.keys(urlEndings) as UrlEndingsKeys[]
const loadedItems = ref([] as UrlEndingsKeys[])

function loadItem(item: UrlEndingsKeys) {
	if (!loadedItems.value.includes(item)) {
		loadedItems.value.push(item)
	}
}

const selectedItem = ref('passingYards' as keyof UrlEndings)
watch(selectedItem, loadItem, { immediate: true })

watch(current, () => {
	items.forEach((_, index) => {
		if (current.has((index + 1).toString()) && items[index]) {
			selectedItem.value = items[index]
		}
	})
})

const iframeHeight = '950px'
</script>

<template>
	<v-autocomplete
		v-model="selectedItem"
		:items="items"
		auto-select-first
		hide-details
		@update:model-value="loadItem"
	></v-autocomplete>
	<template v-for="item in items">
		<v-row
			no-gutters
			:class="[selectedItem != item ? 'd-none' : '']"
			v-if="loadedItems.includes(item)"
		>
			<v-col class="pa-0">
				<h2>Team</h2>
				<iframe
					:src="baseUrl + urlEndings[item].team"
					width="100%"
					:height="iframeHeight"
				/>
			</v-col>
			<v-col class="pa-0">
				<h2>Opponent</h2>
				<iframe
					:src="baseUrl + urlEndings[item].opponent"
					width="100%"
					:height="iframeHeight"
				/>
			</v-col>
		</v-row>
	</template>
</template>
