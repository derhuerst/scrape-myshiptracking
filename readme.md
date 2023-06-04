# scrape-myshiptracking

**Scrape vessel/ship positions from [myshiptracking.com](https://myshiptracking.com/).**

[![npm version](https://img.shields.io/npm/v/scrape-myshiptracking.svg)](https://www.npmjs.com/package/scrape-myshiptracking)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/scrape-myshiptracking.svg)
![minimum Node.js version](https://img.shields.io/node/v/scrape-myshiptracking.svg)
[![support me via GitHub Sponsors](https://img.shields.io/badge/support%20me-donate-fa7664.svg)](https://github.com/sponsors/derhuerst)
[![chat with me on Twitter](https://img.shields.io/badge/chat%20with%20me-on%20Twitter-1da1f2.svg)](https://twitter.com/derhuerst)


## Installation

```shell
npm install scrape-myshiptracking
```


## Usage

```js
import {fetchData} from 'scrape-myshiptracking'

const partOfHamburg = {
	south: 53.516828,
	north: 53.560591,
	west: 9.878242,
	east: 10.019656,
}

await fetchVessels(partOfHamburg)
```

```js
{
	vessels: [
		{
			type: 'passenger',
			name: 'BIRGIT EHLERS',
			latitude: 53.54234,
			longitude: 9.9528,
			speedOverGround: 6.6,
			course: 57.1,
			t: 1685198425,
			headingFor: 'HAMBURG',
		},
		// …
	],
}
```


## Contributing

If you have a question or need support using `scrape-myshiptracking`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, use [the issues page](https://github.com/derhuerst/scrape-myshiptracking/issues).
