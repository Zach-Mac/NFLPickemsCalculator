<script setup lang="ts">
const gamesStore = useGamesStore()
const picksStore = usePicksStore()

const weekNumText = computed(() => (gamesStore.currentWeek != 0 ? gamesStore.currentWeek : 'None'))
</script>

<template>
	<v-row>
		<v-col> ESPN week loaded: {{ weekNumText }} </v-col>
	</v-row>
	<UserInputForm />
	<v-row>
		<v-col>
			<template v-if="!picksStore.picksData.length">
				<h1>Stats</h1>
				<h2>Paste poolhost table html to view stats</h2>
			</template>
			<template v-else-if="!gamesStore.gameData.length">
				<h1>Stats</h1>
				<h2>Load ESPN data to view stats</h2>
			</template>
			<template v-else>
				<Stats />
			</template>
		</v-col>
	</v-row>

	<v-divider class="my-3"></v-divider>

	<v-row>
		<v-col>
			<h1>Player Rankings</h1>
			<template v-if="!picksStore.picksData.length">
				<h2>Paste poolhost table html to view table</h2>
			</template>
			<template v-else-if="!gamesStore.gameData.length">
				<h2>Load ESPN data to view table</h2>
			</template>
			<template v-else>
				<PicksTable class="mb-5" />
			</template>
		</v-col>
	</v-row>

	<template v-if="gamesStore.gameData.length">
		<v-divider class="my-5"></v-divider>

		<v-expansion-panels>
			<v-expansion-panel>
				<v-expansion-panel-title>
					<h2>Internal Game Data</h2>
				</v-expansion-panel-title>
				<v-expansion-panel-text>
					<v-row class="ga-3" no-gutters>
						<ObjectCard v-for="game in gamesStore.gameData" :obj="game" />
					</v-row>
				</v-expansion-panel-text>
			</v-expansion-panel>
		</v-expansion-panels>
	</template>
</template>

<style>
.dimmed {
	position: relative;
}
.dimmed::after {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(var(--v-border-color), var(--v-hover-opacity));
	pointer-events: none;
}

table {
	font-size: 10px;
}
td,
th {
	padding-left: 0px !important;
	padding-right: 0px !important;
}
</style>
