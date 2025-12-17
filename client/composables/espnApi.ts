import axios from 'axios'

const api = axios.create()

api.interceptors.request.use(config => {
	console.log('Sending request to:', config.url)
	return config
})

api.interceptors.response.use(response => {
	console.log('Received response from:', response.config.url)
	console.log('Response data outline:', Object.keys(response.data))
	return response
})

async function getScoreboard(week?: number) {
	let weekParam = ''
	let seasontypeParam = ''

	if (week) {
		let week_ = week

		if (week > 18) {
			week_ = week % 18
			seasontypeParam = `&seasontype=3`
		}

		weekParam = `?week=${week_}`
	}

	const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard${weekParam}${seasontypeParam}`
	const response = await api.get(url)
	return response.data as Scoreboard
}

export const espnApi = {
	getScoreboard
}
