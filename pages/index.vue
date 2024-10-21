<script setup lang="ts"></script>

<template>
	<UserInputForm />
	<template v-if="gameData.length">
		<v-row>
			<v-col>
				<Stats />
			</v-col>
		</v-row>

		<v-divider class="my-3"></v-divider>

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
				<h1>Paste poolhost table html to calculate stats and interact with table</h1>
			</v-col>
		</v-row>
	</template>

	<template v-if="gameData.length">
		<v-divider class="my-5"></v-divider>

		<v-row no-gutters>
			<h2>Internal Game Data:</h2>
		</v-row>
		<v-row class="ga-3" no-gutters>
			<ObjectCard v-for="game in gameData" :obj="game" />
		</v-row>
	</template>

	{{ gameData }}
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

table {
	font-size: 10px;
}
td,
th {
	padding-left: 0px !important;
	padding-right: 0px !important;
}
</style>
