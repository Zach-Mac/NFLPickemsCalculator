<script setup lang="ts">
const { picksTablePasteInput, playerName } = useUserInput()

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
					<v-col sm="4" md="3" lg="2">
						<v-text-field hideDetails v-model="playerName" label="Player name" />
					</v-col>
					<v-col>
						<div class="d-flex">
							<v-btn class="align-self-center me-1" size="large" @click="paste"
								>Paste</v-btn
							>
							<v-textarea
								rows="1"
								hideDetails
								label="Paste Poolhost table html"
								v-model="picksTablePasteInput"
							></v-textarea>
						</div>
					</v-col>
				</v-row>

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
			</v-col>
		</v-row>

		<v-divider class="ma-5"></v-divider>

		<v-row class="mt-5 pt-5">
			<h2>Internal Game Data:</h2>
		</v-row>
		<v-row justify="space-evenly">
			<ObjectCard v-for="game in gameData" :obj="game" />
		</v-row>
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
