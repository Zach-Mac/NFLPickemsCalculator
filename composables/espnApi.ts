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
	const weekParam = week ? `?week=${week}` : ''
	const url = `http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard${weekParam}`
	const response = await api.get(url)
	return response.data as Scoreboard
}

export const espnApi = {
	getScoreboard
}
