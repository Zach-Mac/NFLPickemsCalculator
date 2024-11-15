<script setup lang="ts">
import { mergeProps } from 'vue'

const gamesStore = useGamesStore()
const picksStore = usePicksStore()
const weekOutcomesStore = useWeekOutcomeStore()
const tableStore = useTableStore()
const { smAndDown, mdAndDown } = useDisplay()

const teamButtonSize = computed(() => (mdAndDown.value ? 'x-small' : 'small'))
const iconButtonSize = computed(() => (smAndDown.value ? 'small' : 'default'))

function playerPickedTeam(teamName: string) {
	return picksStore.user ? picksStore.user.picks.includes(teamName) : false
}
const getButtonColor = (teamName: string) => (playerPickedTeam(teamName) ? 'success' : 'error')
const getBaseButtonColor = (teamName: string) => (playerPickedTeam(teamName) ? 'accent' : '')

function setUnfinishedToPlayerPicks() {
	gamesStore.gameData.forEach(game => {
		if (game.state != 'finished') {
			if (!picksStore.user) return

			if (picksStore.user.picks.includes(game.home)) game.winner = game.home
			else if (picksStore.user.picks.includes(game.away)) game.winner = game.away
			else game.winner = ''
		}
	})
}

const lockFinishedGames = ref(false)

const disableButton = (game: Game) => lockFinishedGames.value && game.state == 'finished'

const menu = ref(false)

const numTotalHeaders = inject<Ref<number>>('numHeaders') ?? ref(0)
const headerRow = ref()
const numCurrentHeaders = computed(() => headerRow.value?.children.length ?? 0)
const numHeadersNeeded = computed(() => {
	return numTotalHeaders.value - numCurrentHeaders.value
})
</script>

<template>
	<tr ref="headerRow" class="font-weight-bold">
		<th colspan="2" class="text-center font-weight-bold border-e">
			<v-btn @click="gamesStore.loadEspnScoreboard" :loading="gamesStore.apiLoading">
				Refresh
			</v-btn>
		</th>
		<th
			v-for="game in gamesStore.gameData"
			class="text-center border-e"
			:class="[game.state == 'finished' ? 'dimmed' : '']"
		>
			<v-btn-toggle
				class="vertical w-100"
				v-model="game.winner"
				density="compact"
				variant="flat"
			>
				<v-btn
					:size="teamButtonSize"
					variant="flat"
					class="font-weight-bold"
					:value="game.home"
					:baseColor="getBaseButtonColor(game.home)"
					:color="getButtonColor(game.home)"
					:disabled="disableButton(game)"
				>
					{{ game.home }}
				</v-btn>
				<v-btn
					:size="teamButtonSize"
					variant="flat"
					class="font-weight-bold"
					:value="game.away"
					:baseColor="getBaseButtonColor(game.away)"
					:color="getButtonColor(game.away)"
					:disabled="disableButton(game)"
				>
					{{ game.away }}
				</v-btn>
			</v-btn-toggle>
		</th>
		<th :colspan="numHeadersNeeded">
			<div class="d-flex justify-space-evenly">
				<v-tooltip text="Ideal rest of week" location="bottom">
					<template v-slot:activator="{ props }">
						<v-btn
							:size="iconButtonSize"
							v-bind="props"
							icon="mdi-bullseye-arrow"
							@click="setUnfinishedToPlayerPicks"
						>
						</v-btn>
					</template>
				</v-tooltip>
				<v-tooltip text="Lock finished games" location="bottom">
					<template v-slot:activator="{ props }">
						<ToggleButton
							v-bind="props"
							class="ml-1"
							:size="iconButtonSize"
							v-model="lockFinishedGames"
							iconToggled="mdi-lock"
							iconUntoggled="mdi-lock-open"
						/>
					</template>
				</v-tooltip>
				<v-tooltip text="Manually edit games" location="bottom">
					<template v-slot:activator="{ props }">
						<ToggleButton
							v-bind="props"
							class="ml-1"
							:size="iconButtonSize"
							v-model="tableStore.editGamesMode"
							iconToggled="mdi-pencil"
							iconUntoggled="mdi-pencil"
						/>
					</template>
				</v-tooltip>
				<v-menu :close-on-content-click="false">
					<template v-slot:activator="{ props: menu }">
						<v-tooltip text="Select table columns" location="top">
							<template v-slot:activator="{ props: tooltip }">
								<v-btn
									:size="iconButtonSize"
									v-bind="mergeProps(menu, tooltip)"
									icon="mdi-view-column"
								></v-btn>
							</template>
						</v-tooltip>
					</template>
					<v-list>
						<v-list-item v-for="(value, columnKey) in tableStore.showOptionalColumns">
							<v-list-item-title>
								<v-checkbox
									:label="tableStore.getHeaderTitle(columnKey)"
									v-model="tableStore.showOptionalColumns[columnKey]"
									hide-details
								></v-checkbox>
							</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-menu>
				<!-- <v-number-input
					v-model="weekOutcomesStore.maxGamesToSimLive"
					type="number"
					label="#games to sim"
					hide-details
					variant="outlined"
					control-variant="stacked"
					max-width="8em"
					:min="1"
					:max="16"
				/> -->
				<!-- <v-menu>
					<template v-slot:activator="{ props }">
						<v-btn
							v-bind="props"
							:size="iconButtonSize"
							v-model="lockFinishedGames"
							icon="mdi-cog-outline"
							class="ml-1"
						/>
					</template>
					<v-list>
						<v-list-item>
							<v-list-item-title>
								<v-checkbox
									label="Highlight tied rows"
									v-model="highlightTiedRows"
									hide-details
								></v-checkbox>
							</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-menu> -->
			</div>
		</th>
	</tr>
</template>

<style scoped>
.v-btn-toggle.vertical {
	flex-direction: column;
	height: auto !important;
}
.v-btn-toggle.vertical .v-btn {
	height: 36px !important;
	border-radius: 0;
	border-color: inherit;
	border-start-start-radius: 0;
	border-start-end-radius: 0;
	border-end-start-radius: 0;
	border-end-end-radius: 0;
}
</style>
