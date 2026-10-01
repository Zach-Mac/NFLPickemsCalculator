export const useTableStyles = () => {
	const STYLE_CONFIG = {
		BRIGHTNESS_MULTIPLIER: 5,
		HIGH_PERCENTILE_THRESHOLD: 0.95,
		BASE_BRIGHTNESS: 1
	}

	const styleClasses = {
		gameWon: 'bg-success-lighten-2 text-success-darken-2 font-weight-bold',
		gameLost: 'bg-error-lighten-2 text-error text-decoration-line-through font-weight-bold',
		gameTied: 'bg-accent text-accent-darken-4 font-weight-bold'
	}

	const calculatePercentile = (value: number, values: number[]): number => {
		if (!values.length) return 0
		return values.filter(v => (value > 0 ? v <= value : v >= value)).length / values.length
	}

	// success and error get a lighten-6 from the theme, Vuetify's purple palette stops at lighten-5
	const lightestShade = { success: 6, error: 6, purple: 5 }

	const getStyleClass = (
		value: number,
		percentile: number,
		type: 'success' | 'error' | 'purple'
	): string => {
		const brightnessAdjustment =
			STYLE_CONFIG.BASE_BRIGHTNESS + (1 - percentile) * STYLE_CONFIG.BRIGHTNESS_MULTIPLIER
		const brightnessLevel = Math.min(
			Math.abs(Math.round(brightnessAdjustment)),
			lightestShade[type]
		)
		const boldClass =
			percentile > STYLE_CONFIG.HIGH_PERCENTILE_THRESHOLD ? 'font-weight-bold' : ''
		return `bg-${type}-lighten-${brightnessLevel} ${boldClass}`
	}

	return {
		styleClasses,
		calculatePercentile,
		getStyleClass,
		STYLE_CONFIG
	}
}
