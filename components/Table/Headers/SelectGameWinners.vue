<script setup lang="ts">
import { mergeProps } from 'vue'

const gamesStore = useGamesStore()
const picksStore = usePicksStore()
const weekOutcomesStore = useWeekOutcomesStore()
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
						<v-tooltip text="Settings" location="top">
							<template v-slot:activator="{ props: tooltip }">
								<v-btn
									class="ml-1"
									:size="iconButtonSize"
									v-bind="mergeProps(menu, tooltip)"
									icon="mdi-cog-outline"
								></v-btn>
							</template>
						</v-tooltip>
					</template>
					<v-card>
						<v-card-title> Settings </v-card-title>
						<v-list
							v-model:selected="tableStore.settingsSelection"
							lines="two"
							select-strategy="leaf"
						>
							<v-list-subheader>General</v-list-subheader>
							<v-list-item
								v-for="item in tableStore.settingsItems"
								:key="item.value"
								:subtitle="item.subtitle"
								:title="item.title"
								:value="item.value"
							>
								<template v-slot:prepend="{ isSelected }">
									<v-list-item-action start>
										<v-checkbox-btn :model-value="isSelected"></v-checkbox-btn>
									</v-list-item-action>
								</template>
							</v-list-item>
						</v-list>
						<v-divider></v-divider>
						<v-list
							v-model:selected="tableStore.optionalColumnsSelection"
							lines="two"
							select-strategy="leaf"
						>
							<v-list-subheader>Select Columns</v-list-subheader>
							<v-list-item
								v-for="item in tableStore.optionalHeadersItems"
								:key="item.value"
								:subtitle="item.subtitle"
								:title="item.title"
								:value="item.value"
							>
								<template v-slot:prepend="{ isSelected }">
									<v-list-item-action start>
										<v-checkbox-btn :model-value="isSelected"></v-checkbox-btn>
									</v-list-item-action>
								</template>
							</v-list-item>
						</v-list>
					</v-card>
				</v-menu>
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
