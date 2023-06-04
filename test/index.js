import test from 'node:test'
import {
	ok,
} from 'node:assert'
import {
	fetchData,
} from '../index.js'

const HAMBURG_BBOX = {
	// center of harbour of Hamburg
	south: 53.516828,
	north: 53.560591,
	west: 9.878242,
	east: 10.019656,
}

test('fetchData works with Hamburg bounding box', async () => {
	const {
		vessels,
		others,
	} = await fetchData(HAMBURG_BBOX)

	ok(vessels.length >= 20)

	ok(others.length >= 1)
})
