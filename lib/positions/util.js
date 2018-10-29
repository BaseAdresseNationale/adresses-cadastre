const {max} = require('lodash')
const {point, distance} = require('@turf/turf')

function parcelleNotFound(id) {
  console.error(`Parcelle ${id} introuvable`)
}

function parcelleWithoutGeometry(id) {
  console.error(`Parcelle ${id} sans géométrie`)
}

function computeMaxDistance(ref, ring) {
  return max(ring.map(coords => distance(point(coords), ref) * 1000))
}

module.exports = {parcelleNotFound, parcelleWithoutGeometry, computeMaxDistance}
