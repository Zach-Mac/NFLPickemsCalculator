<script setup lang="ts">
const tableStore = useTableStore()
</script>

<template>
	<v-data-table
		v-bind="$attrs"
		:items="tableStore.items"
		:headers="tableStore.headers"
		:items-per-page="100"
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
