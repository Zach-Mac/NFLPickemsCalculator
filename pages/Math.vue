<script setup lang="ts">
import { useStorage } from '@vueuse/core'
// TODO: by digit

const autoNextQuestion = ref(true)

const minRange = 0
const maxRange = 1000

const xRange = useStorage('xRange', [minRange, maxRange])
const yRange = useStorage('yRange', [minRange, maxRange])

const x = ref(xRange.value[0])
const y = ref(yRange.value[0])

const answer = ref()

function setRandomNums() {
	x.value = Math.ceil(Math.random() * (xRange.value[1] - xRange.value[0] + 1) + xRange.value[0])
	y.value = Math.ceil(Math.random() * (yRange.value[1] - yRange.value[0] + 1) + yRange.value[0])
}

const evalFunctionInput = useStorage('evalFunctionInput', '')

const evalFunction = computed(() => {
	try {
		return (x: number, y: number, a: number) => eval(evalFunctionInput.value)
	} catch (e) {
		return e
	}
})

function checkCorrect() {
	let output = false
	try {
		output = evalFunction.value(x.value, y.value, answer.value)
	} catch (e) {
		console.error(e)
	}
	return output
}

async function genNewQuestion() {
	answer.value = undefined
    await nextTick()
	setRandomNums()
}

// const correctAnswer = computed(() => checkCorrect())

watch(answer, async () => {
	if (checkCorrect() && autoNextQuestion.value) {
		await genNewQuestion()
	}
})
</script>

<template>
	<v-range-slider
		v-model="xRange"
		label="x Range"
		:step="1"
		hide-details
		:min="minRange"
		:max="maxRange"
	>
		<template v-slot:prepend>
			<v-text-field
				v-model="xRange[0]"
				density="compact"
				style="width: '5em' !important"
				type="number"
				variant="outlined"
				hide-details
				single-line
			></v-text-field>
		</template>
		<template v-slot:append>
			<v-text-field
				v-model="xRange[1]"
				density="compact"
				style="width: '5em' !important"
				type="number"
				variant="outlined"
				hide-details
				single-line
			>
			</v-text-field>
		</template>
	</v-range-slider>
	{{ xRange }}
	<v-range-slider
		v-model="yRange"
		label="y Range"
		:step="1"
		hide-details
		:min="minRange"
		:max="maxRange"
	>
		<template v-slot:prepend>
			<v-text-field
				v-model="yRange[0]"
				density="compact"
				style="width: '5em' !important"
				type="number"
				variant="outlined"
				hide-details
				single-line
			>
			</v-text-field>
		</template>
		<template v-slot:append>
			<v-text-field
				v-model="yRange[1]"
				density="compact"
				style="width: '5em' !important"
				type="number"
				variant="outlined"
				hide-details
				single-line
			>
			</v-text-field>
		</template>
	</v-range-slider>

	{{ yRange }}

	<v-btn @click="setRandomNums">Set Random Numbers</v-btn>

	<v-text-field v-model="evalFunctionInput" label="Eval Function"></v-text-field>
	{{ evalFunctionInput }}
	<br />
	{{ evalFunction }}
	<br />
	{{ checkCorrect }}
	<br />
	{{ checkCorrect() }}

	<h2>
		{{ x }}
	</h2>
	<h2>
		{{ y }}
	</h2>

	<v-text-field v-model="answer" label="Answer" type="number"></v-text-field>
	<input v-model="answer" label="Answer" type="number"></input>
	{{ answer }}
</template>
