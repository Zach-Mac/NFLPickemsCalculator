export function countBits(bits: number) {
	bits = bits - ((bits >>> 1) & 0x55555555)
	bits = (bits & 0x33333333) + ((bits >>> 2) & 0x33333333)
	return Math.imul((bits + (bits >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24
}
