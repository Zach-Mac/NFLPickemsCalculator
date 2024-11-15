export function round(num: number, decimalPlaces: number): number {
	return Math.round(num * 10 ** decimalPlaces) / 10 ** decimalPlaces
}

export function deepToRaw<T extends Record<string, any>>(sourceObj: T): T {
	const objectIterator = (input: any): any => {
		if (Array.isArray(input)) {
			return input.map(item => objectIterator(item))
		}
		if (isRef(input) || isReactive(input) || isProxy(input)) {
			return objectIterator(toRaw(input))
		}
		if (input && typeof input === 'object') {
			return Object.keys(input).reduce((acc, key) => {
				acc[key as keyof typeof acc] = objectIterator(input[key])
				return acc
			}, {} as T)
		}
		return input
	}

	return objectIterator(sourceObj)
}

export class ArraySet {
	private set: Set<string>

	constructor() {
		this.set = new Set()
	}

	// Method to add an array to the set
	add(array: boolean[]): boolean {
		// Convert array to a string to ensure uniqueness
		const arrayString = JSON.stringify(array)
		if (!this.set.has(arrayString)) {
			this.set.add(arrayString)
			return true // Added successfully
		}
		return false // Already exists
	}

	addAll(arrays: boolean[][]): void {
		arrays.forEach(array => this.add(array))
	}

	// Method to remove an array from the set
	remove(array: boolean[]): boolean {
		const arrayString = JSON.stringify(array)
		return this.set.delete(arrayString)
	}

	removeAll(arrays: boolean[][]): void {
		arrays.forEach(array => this.remove(array))
	}

	// Method to check if an array is in the set
	has(array: boolean[]): boolean {
		const arrayString = JSON.stringify(array)
		return this.set.has(arrayString)
	}

	// Method to get all arrays in the set
	values(): boolean[][] {
		return Array.from(this.set).map(arrayString => JSON.parse(arrayString))
	}

	pop(): boolean[] | undefined {
		const valuesArray = this.values()
		if (valuesArray.length === 0) return undefined // No arrays to pop

		const lastArray = valuesArray[valuesArray.length - 1]
		this.remove(lastArray) // Remove the last array from the set
		return lastArray // Return the popped array
	}

	// Method to get the number of unique arrays in the set
	size(): number {
		return this.set.size
	}

	// Method to clear all arrays from the set
	clear(): void {
		this.set.clear()
	}
}
