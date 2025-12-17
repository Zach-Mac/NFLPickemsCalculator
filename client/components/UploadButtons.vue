<script setup lang="ts">
const picksStore = usePicksStore()
const nfeloStore = useNfeloStore()
const { smAndDown } = useDisplay()

const pasteText = 'Paste from clipboard'
const maxDialogWidth = computed(() => (smAndDown.value ? '90%' : '50%'))

const paste = async (target: 'picks' | 'nfelo') => {
	try {
		const text = await navigator.clipboard.readText()
		if (target === 'picks') picksStore.setPicksTablePasteInput(text)
		else nfeloStore.setNfeloGamesInput(text)
	} catch (err) {
		console.error('Failed to read clipboard:', err)
	}
}

const setDefaultPoolhostButtonColor = computed(() =>
	!picksStore.picksTablePasteInputIsDefault ? 'primary' : undefined
)
const setDefaultNfeloButtonColor = computed(() =>
	!nfeloStore.nfeloGamesInputIsDefault ? 'primary' : undefined
)

const tempPicksTablePasteInput = ref(picksStore.picksTablePasteInput)
watch(tempPicksTablePasteInput, () =>
	picksStore.setPicksTablePasteInput(tempPicksTablePasteInput.value)
)

const tempNfeloGamesInput = ref(nfeloStore.nfeloGamesInput)
watch(tempNfeloGamesInput, () => nfeloStore.setNfeloGamesInput(tempNfeloGamesInput.value))

const setPicksTableManual = ref(false)
const setNfeloManual = ref(false)
</script>

<template>
	<v-row>
		<v-col cols="auto" class="px-1 px-md-1">
			<v-card :color="picksStore.picksDataValidated ? undefined : 'error-lighten-3'">
				<template v-if="!picksStore.picksDataValidated" v-slot:append>
					<v-icon color="error" icon="mdi-alert-circle"> </v-icon>
				</template>
				<!-- <table v-html="picksStore.picksTablePasteInput" class="tinyTable"></table> -->
				<v-card-title class="pb-0"> Poolhost Table </v-card-title>
				<v-card-actions :style="{ minHeight: 0 }">
					<v-btn
						@click="picksStore.resetPicksTablePasteInput"
						prepend-icon="mdi-table-sync"
						:color="setDefaultPoolhostButtonColor"
						variant="elevated"
					>
						Use Default
					</v-btn>
					<v-btn
						@click="setPicksTableManual = true"
						prepend-icon="mdi-pencil"
						variant="elevated"
					>
						Edit
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-col>
		<v-col cols="auto" class="px-1 px-md-1">
			<v-card :color="nfeloStore.nfeloGamesValidated ? undefined : 'error-lighten-3'">
				<template v-if="!nfeloStore.nfeloGamesValidated" v-slot:append>
					<v-icon color="error" icon="mdi-alert-circle"> </v-icon>
				</template>
				<v-card-title class="pb-0"> nfelo Data </v-card-title>
				<v-card-actions :style="{ minHeight: 0 }">
					<v-btn
						@click="nfeloStore.resetNfeloGamesInput"
						prepend-icon="mdi-database-sync"
						:color="setDefaultNfeloButtonColor"
						variant="elevated"
					>
						Use Default
					</v-btn>
					<v-btn
						@click="setNfeloManual = true"
						prepend-icon="mdi-pencil"
						variant="elevated"
					>
						Edit
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-col>
	</v-row>
	<v-dialog v-model="setPicksTableManual" :max-width="maxDialogWidth">
		<v-confirm-edit v-model="tempPicksTablePasteInput">
			<template v-slot:default="{ model, actions }">
				<v-card>
					<v-card-item>
						<v-card-title> <h3>Poolhost Table</h3> </v-card-title>
					</v-card-item>
					<v-card-text>
						<v-banner
							v-if="!picksStore.picksDataValidated"
							color="error"
							icon="mdi-alert-circle"
						>
							<v-banner-text class="pe-3">
								Picks paste doesn't match ESPN data
							</v-banner-text>
						</v-banner>
						<v-textarea
							rows="20"
							hideDetails
							label="Paste Poolhost table html"
							v-model="model.value"
						/>
					</v-card-text>
					<v-card-item>
						<v-card-actions class="pa-0">
							<v-btn
								:size="'large'"
								@click="paste('picks')"
								color="primary"
								variant="elevated"
							>
								{{ pasteText }}
							</v-btn>
							<v-spacer></v-spacer>

							<component :is="actions"></component>
						</v-card-actions>
					</v-card-item>
				</v-card>
			</template>
		</v-confirm-edit>
	</v-dialog>
	<v-dialog v-model="setNfeloManual" :max-width="maxDialogWidth">
		<v-confirm-edit v-model="tempNfeloGamesInput">
			<template v-slot:default="{ model, actions }">
				<v-card>
					<v-card-item>
						<v-card-title><h3>nfelo Data</h3> </v-card-title>
					</v-card-item>
					<v-card-text>
						<v-banner
							v-if="!nfeloStore.nfeloGamesValidated"
							color="error"
							icon="mdi-alert-circle"
						>
							<v-banner-text class="pe-3">
								nfelo paste doesn't match either the ESPN or Poolhost data
							</v-banner-text>
						</v-banner>
						<v-textarea
							rows="20"
							hideDetails
							label="Paste nfelo game data"
							v-model="model.value"
							:rules="[() => nfeloStore.nfeloGamesValidated]"
						/>
						<v-expansion-panels>
							<v-expansion-panel title="Internal Data">
								<v-expansion-panel-text>
									<v-row class="ga-3" no-gutters>
										<template v-for="game in nfeloStore.nfeloGames">
											<ObjectCard v-if="game" :obj="game" />
										</template>
									</v-row>
								</v-expansion-panel-text>
							</v-expansion-panel>
						</v-expansion-panels>
					</v-card-text>
					<v-card-item>
						<v-card-actions class="pa-0">
							<v-btn
								:size="'large'"
								@click="paste('nfelo')"
								color="primary"
								variant="elevated"
							>
								{{ pasteText }}
							</v-btn>
							<v-spacer></v-spacer>
							<component :is="actions"></component>
						</v-card-actions>
					</v-card-item>
				</v-card>
			</template>
		</v-confirm-edit>
	</v-dialog>
</template>
