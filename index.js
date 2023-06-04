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

	// todo
}

export {
	fetchData,
}
