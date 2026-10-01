export const useTiebreakerStore = defineStore('tiebreaker', () => {
	const picksStore = usePicksStore()
	const gamesStore = useGamesStore()

	const game = computed(() => {
		const teams = picksStore.tiebreakerTeams
		if (!teams.length) return undefined
		return gamesStore.gameData.find(
			game => teams.includes(game.home) && teams.includes(game.away)
		)
	})

	const overUnder = ref<number>()
	const loadingOverUnder = ref(false)
	watch(
		() => game.value?.espn.eventId,
		async (_eventId, _oldEventId, onCleanup) => {
			let superseded = false
			onCleanup(() => (superseded = true))

			overUnder.value = undefined
			loadingOverUnder.value = Boolean(game.value)
			if (!game.value) return

			const { eventId, competitionId } = game.value.espn
			const result = await espnApi.getOverUnder(eventId, competitionId).catch(error => {
				console.error('Failed to load tiebreaker over/under:', error)
				return undefined
			})
			if (superseded) return

			overUnder.value = result
			loadingOverUnder.value = false
		},
		{ immediate: true }
	)

	const probabilityByTotal = computed(
		() => game.value && finalTotalProbabilities(game.value, overUnder.value)
	)

	const evenSplitReason = computed(() => {
		if (!picksStore.tiebreakerTeams.length)
			return "Couldn't find the tiebreaker game in the picks paste"
		if (!game.value)
			return `Couldn't find ${picksStore.tiebreakerTeams.join('/')} in this week's ESPN games`
		if (!probabilityByTotal.value && !loadingOverUnder.value)
			return `ESPN has no over/under for ${game.value.away} @ ${game.value.home}`
		return undefined
	})

	return {
		game,
		overUnder: readonly(overUnder),
		probabilityByTotal,
		evenSplitReason
	}
})

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useTiebreakerStore, import.meta.hot))
}
