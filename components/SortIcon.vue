<script setup lang="ts">
import type { InternalDataTableHeader, provideSort } from '~/utils/typesVuetify'

const tableStore = useTableStore()
const props = defineProps<{
	columns: InternalDataTableHeader[]
	isSorted: ReturnType<typeof provideSort>['isSorted']
	keyToSortBy: HeaderKey
}>()
</script>

<template>
	<v-icon
		class="v-data-table-header__sort-icon"
		:class="isSorted(columns.find(c => c.key == keyToSortBy)!) ? 'opacity-100' : ''"
		icon="mdi-arrow-down"
	/>
</template>
