import test from 'node:test'
import {fileURLToPath} from 'node:url'
import {readFileSync} from 'node:fs'
import {
	deepStrictEqual,
	strictEqual,
	ok,
} from 'node:assert'
import {
	_parseData,
	VESSEL_TYPES,
	OTHER_TYPES,
	fetchData,
} from '../index.js'

const hamburg0 = readFileSync(
	fileURLToPath(new URL('./hamburg-2023-05-27T16%3A41%3A39%2B02%3A00.txt', import.meta.url)),
	{encoding: 'utf8'},
)

const HAMBURG_BBOX = {
	// center of harbour of Hamburg
	south: 53.516828,
	north: 53.560591,
	west: 9.878242,
	east: 10.019656,
}

const assertValidVessel = (v, name = 'vessel') => {
	ok(Object.keys(VESSEL_TYPES).includes(v.type), name + '.type')
	if (v.t !== null) {
		ok(Number.isInteger(v.t), name + '.t')
	}
	strictEqual(typeof v.name, 'string', name + '.name')
	ok(v.name, name + '.name')
	if (v.latitude !== null) {
		ok(Number.isFinite(v.latitude), name + '.latitude')
	}
	if (v.longitude !== null) {
		ok(Number.isFinite(v.longitude), name + '.longitude')
	}
	if (v.speedOverGround !== null) {
		ok(Number.isFinite(v.speedOverGround), name + '.speedOverGround')
	}
	if (v.course !== null) {
		ok(Number.isFinite(v.course), name + '.course')
	}
	if (v.headingFor !== null) {
		strictEqual(typeof v.headingFor, 'string', name + '.headingFor')
		ok(v.headingFor, name + '.headingFor')
	}
}

const assertValidOther = (o, name = 'other') => {
	ok(Object.keys(OTHER_TYPES).includes(o.type), name + '.type')
	strictEqual(typeof o.name, 'string', name + '.name')
	ok(o.name, name + '.name')
	if (o.latitude !== null) {
		ok(Number.isFinite(o.latitude), name + '.latitude')
	}
	if (o.longitude !== null) {
		ok(Number.isFinite(o.longitude), name + '.longitude')
	}
}

const checkArray = (checkItem, items, name = 'items') => {
	ok(Array.isArray(items), name + ' must be an array')
	for (let i = 0; i < items.length; i++) {
		checkItem(items[i], name + `[${i}]`)
	}
}

test('_parseData works with Hamburg 2023-05-27', async () => {
	const {
		t,
		vessels,
		others,
	} = await _parseData(hamburg0)

	strictEqual(t, 1685198499)

	checkArray(assertValidVessel, vessels, 'vessels')
	strictEqual(vessels.length, 262)

	const birgitEhlers = vessels.find(v => v.name === 'BIRGIT EHLERS')
	deepStrictEqual(birgitEhlers, {
		type: 'passenger',
		name: 'BIRGIT EHLERS',
		latitude: 53.54234,
		longitude: 9.9528,
		speedOverGround: 6.6,
		course: 57.1,
		t: 1685198425,
		headingFor: 'HAMBURG',
	})

	checkArray(assertValidOther, others, 'others')
	strictEqual(others.length, 1)

	const hamburg = others.find(v => v.name === 'HAMBURG')
	deepStrictEqual(hamburg, {
		type: 'port',
		name: 'HAMBURG',
		latitude: 53.5349,
		longitude: 9.97992,
	})
})

test('fetchData works with Hamburg bounding box', async () => {
	const {
		vessels,
		others,
	} = await fetchData(HAMBURG_BBOX)

	checkArray(assertValidVessel, vessels, 'vessels')
	ok(vessels.length >= 20)

	checkArray(assertValidOther, others, 'others')
	ok(others.length >= 1)

	const hamburg = others.find(v => v.name === 'HAMBURG')
	ok(hamburg)
})
