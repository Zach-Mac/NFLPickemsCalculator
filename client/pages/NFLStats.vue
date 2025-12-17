<script setup lang="ts">
const { current } = useMagicKeys()

const baseUrl = 'https://www.teamrankings.com/nfl/stat/'

const defaultUrlEndings = {
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
	rushingTds: {
		team: 'rushing-touchdowns-per-game',
		opponent: 'opponent-rushing-touchdowns-per-game'
	},
	sacks: {
		team: 'sacks-per-game',
		opponent: 'qb-sacked-per-game'
	}
}
const urlEndingsString = useLocalStorage(
	'NFLStats_urlEndings',
	JSON.stringify(defaultUrlEndings, null, 2)
)
const urlEndings = computed(() => JSON.parse(urlEndingsString.value))

type UrlEndings = typeof urlEndings.value
type UrlEndingsKeys = keyof UrlEndings

const items = computed(() => Object.keys(urlEndings.value) as UrlEndingsKeys[])
const loadedItems = ref([] as UrlEndingsKeys[])

function loadItem(item: UrlEndingsKeys) {
	if (!loadedItems.value.includes(item)) {
		loadedItems.value.push(item)
	}
}

const selectedItem = ref('passingYards' as keyof UrlEndings)
watch(selectedItem, loadItem, { immediate: true })

watch(current, () => {
	items.value.forEach((_, index) => {
		if (current.has((index + 1).toString()) && items.value[index]) {
			selectedItem.value = items.value[index]
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

	<v-confirm-edit v-model="urlEndingsString">
		<template v-slot:default="{ model, actions }">
			<v-card class="mx-auto">
				<template v-slot:text>
					<v-textarea
						v-model="model.value"
						:rows="Object.keys(urlEndings).length * 4 + 2"
					/>
				</template>

				<template v-slot:actions>
					<component :is="actions" size="x-large"></component>
				</template>
			</v-card>
		</template>
	</v-confirm-edit>
</template>
