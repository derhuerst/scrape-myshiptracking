// todo: use import assertions once they're supported by Node.js & ESLint
// https://github.com/tc39/proposal-import-assertions
import {createRequire} from 'node:module'
const require = createRequire(import.meta.url)

import createDebug from 'debug'
import {fetch} from 'cross-fetch'
const pkg = require('./package.json')

const VESSELS_BASE_URL = `\
https://www.myshiptracking.com/requests/vesselsonmaptempTTT.php?type=json&zoom=17&selid=-1&seltype=0&timecode=-1`

const DEFAULT_USER_AGENT = `${pkg.name} v${pkg.version}`

const VESSEL_TYPES = {
	unknown: 0,
	tugPilot: 3,
	highspeed: 4,
	passenger: 6,
	cargo: 7,
	tanker: 8,
	yachtOthers: 9,
	fishing: 10,
}
const VESSEL_TYPES_REVERSE = []
VESSEL_TYPES_REVERSE[0] = 'unknown'
VESSEL_TYPES_REVERSE[3] = 'tugPilot'
VESSEL_TYPES_REVERSE[4] = 'highspeed'
VESSEL_TYPES_REVERSE[6] = 'passenger'
VESSEL_TYPES_REVERSE[7] = 'cargo'
VESSEL_TYPES_REVERSE[8] = 'tanker'
VESSEL_TYPES_REVERSE[9] = 'yachtOthers'
VESSEL_TYPES_REVERSE[10] = 'fishing'

const OTHER_TYPES = {
	port: 1,
	baseStation: 11,
	aircraft: 12,
	navigationAid: 13,
}
const OTHER_TYPES_REVERSE = []
OTHER_TYPES_REVERSE[1] = 'port'
OTHER_TYPES_REVERSE[11] = 'baseStation'
OTHER_TYPES_REVERSE[12] = 'aircraft'
OTHER_TYPES_REVERSE[13] = 'navigationAid'

const debug = createDebug('scrape-myshiptracking')

const MAX_LINE_LENGTH = 10 * 1024
const _parseData = (tsvLike) => {
	let t = null
	const vessels = []
	const others = []

	// todo: write a more robust parser
	const lineBreaks = /[\r\n]{1,2}/g[Symbol.matchAll](tsvLike)
	let l = 0, lineStartI = 0
	let preludeRead = false
	for (const rn of lineBreaks) {
		const {index: lineBreakI} = rn
		const lineEndI = lineBreakI + rn[0].length
		if ((lineBreakI - lineStartI) > MAX_LINE_LENGTH) {
			throw new Error(`failed to parse: too long line (${lineBreakI - lineStartI})`)
		}

		const line = tsvLike.slice(lineStartI, lineBreakI) // without line break
		// debug({lineNr: l, lineStartI, lineBreakI, lineEndI, line})

		if (!preludeRead) {
			if (l === 0) {
				// line 0: timestamp
				debug('prelude timestamp:', tsvLike.slice(0, lineBreakI))
				t = parseInt(tsvLike.slice(0, lineBreakI))
			} else if (l === 1) {
				// todo: what is line 1?

				debug('prelude fully read')
				preludeRead = true
			}
		} else {
			// parse tab-separated values
			const cols = line.split('\t')

			let type = parseInt(cols[0])
			if (VESSEL_TYPES_REVERSE[type]) {
				type = VESSEL_TYPES_REVERSE[type]
				const vessel = {
					type,
					// todo: what is cols[1]?
					// todo: what is cols[2]?
					name: cols[3] || null,
					latitude: cols[4] ? parseFloat(cols[4]) : null,
					longitude: cols[5] ? parseFloat(cols[5]) : null,
					speedOverGround: cols[6] ? parseFloat(cols[6]) : null,
					course: cols[7] ? parseFloat(cols[7]) : null, // in degrees
					// todo: is cols[8] beam?
					// todo: is cols[9] length?
					// todo: what is cols[10]?
					// todo: what is cols[11]?
					// todo: what is cols[12]?
					t: cols[13] ? parseFloat(cols[13]) : null,
					headingFor: cols[14] || null,
				}
				vessels.push(vessel)
			} else if (OTHER_TYPES_REVERSE[type]) {
				type = OTHER_TYPES_REVERSE[type]
				const item = {
					type,
					// todo: what is cols[1]?
					name: cols[2] || null,
					latitude: cols[3] ? parseFloat(cols[3]) : null,
					longitude: cols[4] ? parseFloat(cols[4]) : null,
				}
				others.push(item)
			} else {
				debug(`unknown type (${type}):`, cols)
			}
		}

		l++
		lineStartI = lineEndI
	}

	return {
		t,
		vessels,
		others,
	}
}

const normalizeTypes = (defaultTypes, customTypes) => {
	if (customTypes === null) {
		return defaultTypes
	}
	if (Array.isArray(customTypes)) {
		return customTypes
	}
	const types = {...defaultTypes}
	Object.assign(types, customTypes)
	return Object.entries(types)
	.filter(([_, enabled]) => !!enabled)
	.map(([type]) => type)
}

const fetchData = async (bbox, opt = {}) => {
	if (!Number.isFinite(bbox.north)) {
		throw new TypeError('bbox.north must be a number')
	}
	if (!Number.isFinite(bbox.east)) {
		throw new TypeError('bbox.east must be a number')
	}
	if (!Number.isFinite(bbox.south)) {
		throw new TypeError('bbox.south must be a number')
	}
	if (!Number.isFinite(bbox.west)) {
		throw new TypeError('bbox.west must be a number')
	}
	const {
		userAgent,
	} = {
		userAgent: null,
		...opt,
	}

	const vesselTypes = normalizeTypes(
		Object.keys(VESSEL_TYPES).map(type => [type, true]),
		opt.vesselTypes,
	)
	// const otherTypes = normalizeTypes(
	// 	Object.keys(OTHER_TYPES).map(type => [type, true]),
	// 	opt.otherTypes,
	// )

	const target = new URL(VESSELS_BASE_URL)
	target.searchParams.set('minlat', bbox.south)
	target.searchParams.set('minlon', bbox.west)
	target.searchParams.set('maxlat', bbox.north)
	target.searchParams.set('maxlon', bbox.east)
	target.searchParams.set('filters', JSON.stringify({
		vtypes: vesselTypes,
		// todo: otherTypes?
		ports: '1',
	}))
	const url = target.href

	const res = await fetch(url, {
		headers: {
			'accept': 'text/plain',
			'user-agent': userAgent || DEFAULT_USER_AGENT,
		},
		redirect: 'follow',
	})
	if (!res.ok) {
		let body = null
		try {
			body = await res.text()
		} catch (err) {
			//
		}
		const err = new Error()
		err.url = url
		err.status = res.status
		err.statusText = res.statusText
		err.responseBody = body
		throw err
	}
	const body = await res.text()

	const data = _parseData(body)
	return data
}

export {
	VESSEL_TYPES,
	OTHER_TYPES,
	fetchData,
	_parseData,
}
