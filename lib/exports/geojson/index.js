const {through, pipeline} = require('mississippi')
const {feature} = require('@turf/turf')
const {omit, snakeCase, mapKeys} = require('lodash')
const {stringify} = require('../../util/geojson-stream')

function serialize() {
  return pipeline.obj(
    through.obj((adresse, enc, cb) => {
      if (!adresse.bestPosition) return cb()
      const properties = mapKeys(omit(adresse, 'bestPosition'), (v, k) => snakeCase(k))
      cb(null, feature(adresse.bestPosition.geometry, properties))
    }),
    stringify()
  )
}

module.exports = {serialize}
