<script setup lang="ts">
const { picksTablePasteInput, playerName, loadPasteHistory, pasteHistoryExists } =
	usePoolhostInput()
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
							<v-list-item-title> Load {{ item }} pastes ago</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-menu>
			</v-btn>
		</v-col>
	</v-row>
</template>
