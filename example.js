import {fetchVessels} from './index.js'

const partOfHamburg = {
	south: 53.516828,
	north: 53.560591,
	west: 9.878242,
	east: 10.019656,
}

const {vessels} = await fetchVessels(partOfHamburg)
console.log(...vessels.map(v => ({...v, t: new Date(v.t * 1000)})))
