import { defineEventHandler, getQuery } from 'h3'
import axios from 'axios'

export default defineEventHandler(async event => {
	const { url } = getQuery(event)
	const { data } = await axios.get(url as string)
	return data
})
