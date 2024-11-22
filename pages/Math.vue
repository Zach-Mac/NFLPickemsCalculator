<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import type { VNodeRef } from 'vue';
// TODO: by digit

const autoNextQuestion = ref(true)

const minRange = 0
const maxRange = 1000

const xRange = useStorage('xRange', [minRange, maxRange])
const yRange = useStorage('yRange', [minRange, maxRange])

const x = ref(xRange.value[0])
const y = ref(yRange.value[0])

const answerString = ref('')
const answerNum = computed(() => parseInt(answerString.value))

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
	let correct = false
	try {
		correct = evalFunction.value(x.value, y.value, answerNum.value)
	} catch (e) {
		console.error(e)
	}
	return correct
}

async function genNewQuestion() {
	answerString.value = ''
    await nextTick()
	setRandomNums()
}

// const correctAnswer = computed(() => checkCorrect())

watch(answerString, async () => {
	if (checkCorrect() && autoNextQuestion.value) {
		await genNewQuestion()
	}
})

function clickNum(num: number) {
    if (num === -1) {}
    else if (num === -2) 
        answerString.value = answerString.value.slice(0, -1)
    else
        answerString.value = answerString.value + num
}

// get button width
const button = ref(null as VNodeRef | null)
const { width } = useElementSize(button)
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

	<v-text-field v-model="answerString" label="Answer" type="number"></v-text-field>
	<input v-model="answerString" label="Answer" type="number"></input>
	{{ answerString }}


    <!-- numeric keypad -->
    <v-container>
        <v-row v-for="i in [3,2,1]" no-gutters>
            <v-col v-for="j in 3" :key="j">
                <button ref="button" @click="clickNum(3*(i-1)+j)" :style="{height: width + 'px'}" class="w-100">{{ 3*(i-1)+j }}</button>
            </v-col>
        </v-row>
        <v-row no-gutters>
            <v-col>
                <button @click="clickNum(-1)" :style="{height: width + 'px'}" class="w-100">-</button>
            </v-col>
            <v-col>
                <button @click="clickNum(0)" :style="{height: width + 'px'}" class="w-100">0</button>
            </v-col>
            <v-col>
                <button @click="clickNum(-2)" :style="{height: width + 'px'}" class="w-100">Del</button>
            </v-col>
        </v-row>
        </v-container>
</template>
