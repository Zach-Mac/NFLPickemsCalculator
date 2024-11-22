<script setup lang="ts">
const gamesStore = useGamesStore()
const picksStore = usePicksStore()
const weekOutcomesStore = useWeekOutcomesStore()
const tableStore = useTableStore()
</script>

<template>
	<v-data-table
		v-bind="$attrs"
		:items="tableStore.items"
		:headers="tableStore.headers"
		:items-per-page="50"
		density="compact"
		hover
		class="border"
		multi-sort
		:sort-by="tableStore.sortBy"
	>
		<template v-slot:headers="{ columns, isSorted }">
			<TableHeaders :columns="columns" :isSorted="isSorted" />
		</template>
		<template v-slot:item="{ item: playerPicks, index }">
			<TableItemSlot v-bind="{ playerPicks, index }" />
		</template>
	</v-data-table>
</template>

<style scoped>
a.nostyle {
	text-decoration: inherit;
	color: inherit;
}
</style>
