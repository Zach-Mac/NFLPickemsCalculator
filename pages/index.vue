<script setup lang="ts">
const { picksTablePasteInput, playerName, loadPasteHistory, pasteHistoryExists } = useUserInput()
const { smAndDown } = useDisplay()

const pasteText = computed(() => (smAndDown.value ? 'Paste' : 'Paste'))

async function paste() {
	try {
		picksTablePasteInput.value = await navigator.clipboard.readText()
	} catch (err) {
		console.error('Failed to read clipboard contents: ', err)
	}
}
</script>

<template>
	<v-container fluid>
		<v-row>
			<v-col lg="11" class="mx-auto">
				<v-row>
					<v-col cols="4" sm="4" md="3" lg="2" class="pe-1 pe-md-3">
						<v-text-field hideDetails v-model="playerName" label="Player name" />
					</v-col>
					<v-col class="px-1 px-md-3">
						<div class="d-flex">
							<v-btn
								class="align-self-center me-1"
								:size="'large'"
								@click="paste"
								:slim="smAndDown"
							>
								{{ pasteText }}
							</v-btn>
							<v-textarea
								rows="1"
								hideDetails
								label="Paste Poolhost table html"
								v-model="picksTablePasteInput"
							></v-textarea>
						</div>
					</v-col>
					<v-col cols="auto" class="ps-1 ps-md-3 align-self-center">
						<v-btn size="large" :slim="smAndDown">
							History

							<v-menu activator="parent">
								<v-list>
									<v-list-item
										v-for="(item, index) in 3"
										:key="index"
										:value="index"
										:disabled="!pasteHistoryExists(index)"
										@click="loadPasteHistory(index)"
									>
										<v-list-item-title>
											Load {{ item }} pastes ago</v-list-item-title
										>
									</v-list-item>
								</v-list>
							</v-menu>
						</v-btn>
					</v-col>
				</v-row>
				<template v-if="gameData.length">
					<v-row>
						<v-col>
							<Stats />
						</v-col>
					</v-row>

					<v-divider class="ma-5"></v-divider>

					<v-row>
						<v-col>
							<h1>Player Rankings</h1>
							<PicksTable class="mb-5" />
						</v-col>
					</v-row>
				</template>
				<template v-else>
					<v-row>
						<v-col>
							<h1>
								Paste poolhost table html to calculate stats and interact with table
							</h1>
						</v-col>
					</v-row>
				</template>
			</v-col>
		</v-row>

		<template v-if="gameData.length">
			<v-divider class="ma-5"></v-divider>

			<v-row class="mt-5 pt-5">
				<h2>Internal Game Data:</h2>
			</v-row>
			<v-row justify="space-evenly">
				<ObjectCard v-for="game in gameData" :obj="game" />
			</v-row>
		</template>
	</v-container>
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

.pa-05 {
	padding: 2px !important;
}
.px-05 {
	padding-left: 2px !important;
	padding-right: 2px !important;
}
.py-05 {
	padding-top: 2px !important;
	padding-bottom: 2px !important;
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
