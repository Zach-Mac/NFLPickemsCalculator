<script setup lang="ts">
useHead({
	title: 'NFL Pickems Calculator',
	meta: [
		{
			name: 'description',
			content: 'NFL Pickems Calculator'
		}
	]
})

const { xs, smAndUp } = useDisplay()
const drawer = ref(false)

const route = useRoute()
const router = useRouter()

const pages = [
	{
		title: 'Home',
		path: '/',
		icon: 'mdi-home-outline'
	},
	{
		title: 'nfelo',
		path: '/nfelo',
		icon: 'mdi-football'
	}
]
const currentPage = computed(() => pages.find(page => page.path === route.path))

const error = ref<Error | null>(null)
onErrorCaptured((err: Error) => {
	console.error('Application error:', err)
	error.value = err
	return true
})

const nuxtError = useError()
watch(nuxtError, () => {
	if (nuxtError.value) {
		console.error('Nuxt error:', nuxtError.value)
		error.value = nuxtError.value
	}
})

function handleError(err: unknown) {
	console.log('Error handled:', err)
	error.value = err as Error
	return true
}

const clearError = ref(null)
</script>

<template>
	<v-layout>
		<!-- <v-app-bar class="px-sm-4" density="compact">
			<template #prepend>
				<v-app-bar-nav-icon v-if="xs" @click="drawer = !drawer" />
			</template>

			<template v-if="smAndUp">
				<v-btn
					v-for="(page, i) in pages"
					@click="router.push(page.path)"
					:key="i"
					:active="page.path === route.path"
					class="mx-2"
					size="large"
				>
					{{ page.title }}
				</v-btn>
			</template>
			<v-spacer />
		</v-app-bar>

		<v-navigation-drawer v-if="xs" v-model="drawer" location="top" temporary width="355">
			<v-list class="py-0" slim>
				<v-list-item
					v-for="(page, i) in pages"
					@click="router.push(page.path)"
					link
					:prepend-icon="page.icon"
					:title="page.title"
				/>
			</v-list>
		</v-navigation-drawer> -->

		<v-main>
			<v-container fluid>
				<v-row>
					<v-col lg="11" class="mx-auto">
						<ErrorAlert :error="error" closable />
						<NuxtErrorBoundary @error="handleError">
							<NuxtPage />
							<template #error="{ error, clearError }">
								<v-btn @click="clearError">Clear Error</v-btn>
							</template>
						</NuxtErrorBoundary>
					</v-col>
				</v-row>
			</v-container>
		</v-main>
	</v-layout>
</template>
