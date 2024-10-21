<script setup lang="ts">
const { nfeloGamesInput, nfeloGames } = useNfeloInput()
</script>

<template>
	<v-textarea hideDetails label="Paste nfelo game data" v-model="nfeloGamesInput"></v-textarea>

	<v-divider class="my-5"></v-divider>

	<v-row class="ga-3" no-gutters>
		<ObjectCard v-for="game in nfeloGames" :obj="game" />
	</v-row>
</template>
