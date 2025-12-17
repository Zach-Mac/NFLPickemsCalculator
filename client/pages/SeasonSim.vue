<script setup lang="ts">
const pasted = useLocalStorage('seasonSimPaste', '')

const seasonTotals = computed(() => {
	const totals = {} as Record<string, number>

	const lines = pasted.value.split('\n')
	for (const line of lines) {
		const [playerName, value] = line.split('\t')

		totals[playerName] = parseInt(value)
	}
	return totals
})

const currentWeek = useLocalStorage('seasonSimCurrentWeek', 1)
const winProb = ref(0.6)
const numSims = ref(10000)
const loading = ref(false)

const numGamesLeft = computed(() => {
	const weeksLeft = 18 - currentWeek.value + 1
	const seasonGamesLeft = weeksLeft * 15
	const playoffGamesLeft = 13
	const gamesLeft = seasonGamesLeft + playoffGamesLeft

	return gamesLeft
})

interface SimOutput {
	[k: string]: {
		money: number
		chance: number
		chanceOver100: number
	}
}

// const sim = ref() as Ref<SimOutput | undefined>
const sim = useLocalStorage('seasonSimSim', {} as SimOutput)
const simulateSeason = async () => {
	console.log('Simulating season')
	loading.value = true
	const evs = await runSim(seasonTotals.value, numGamesLeft.value, winProb.value, numSims.value)
	loading.value = false
	console.log('evs', evs)
	sim.value = evs
}
const items = computed(() => {
	if (!sim.value) return []
	if (!seasonTotals.value) return []
	if (Object.keys(sim.value).length === 0) return []

	try {
		const items = []
		for (const [name, { money, chance, chanceOver100 }] of Object.entries(sim.value)) {
			const seasonTotal = seasonTotals.value[name]
			items.push({
				name,
				'Original Season Total': seasonTotal,
				EV: money,
				'Chance to Win Prize (%)': chance.toFixed(2),
				'Chance to Win 100$ or More (%)': chanceOver100.toFixed(2)
			})
		}
		return items
	} catch (e) {
		console.log(e)
		return []
	}
})
</script>

<template>
	<v-row>
		<v-col>
			<v-row class="my-3">
				<v-col>
					<v-text-field
						v-model="currentWeek"
						label="Upcoming week"
						type="number"
						hide-details
					></v-text-field>
					Games Left: {{ numGamesLeft }}
				</v-col>
				<v-col>
					<v-text-field
						v-model="winProb"
						label="Win Probability"
						type="number"
						hide-details
					></v-text-field>
				</v-col>
				<v-col>
					<v-text-field
						v-model="numSims"
						label="Number of Simulations"
						type="number"
						hide-details
					></v-text-field>
				</v-col>
			</v-row>

			<v-row>
				<v-col cols="auto" class="height-screen">
					<v-textarea v-model="pasted" hide-details :rows="45"> </v-textarea>
				</v-col>
				<v-col cols="auto">
					<ObjectCard :obj="seasonTotals" title="Season Totals" />
				</v-col>
				<v-col cols="auto">
					<v-btn @click="simulateSeason" :loading="loading" color="primary"
						>Simulate Season</v-btn
					>
					<template v-if="loading">
						<v-progress-linear indeterminate></v-progress-linear>
					</template>

					<v-data-table :items="items" :items-per-page="100"> </v-data-table>
				</v-col>
			</v-row>
		</v-col>
	</v-row>
</template>

<style scoped>
.h-25 {
	height: 25vh;
}
</style>
