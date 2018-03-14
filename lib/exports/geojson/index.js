const {through, pipeline} = require('mississippi')
const {feature} = require('@turf/turf')
const {pick, snakeCase, mapKeys} = require('lodash')
const {stringify} = require('../../util/geojson-stream')

const PROPERTIES_TO_PICK = [
  'id',
  'numeroComplet',
  'pseudoNumero',
  'libelleVoieRetenu',
  'libelleVoieType',
  'codeCommune',
  'codePostal',
  'libelleAcheminement',
  'positionType',
  'positionErrorMargin',
  'poidsMax',
  'categoriesUtiles',
  'codesParcelles'
]

function serialize() {
  return pipeline.obj(
    through.obj((adresse, enc, cb) => {
      if (!adresse.position) return cb()
      const properties = mapKeys(pick(adresse, ...PROPERTIES_TO_PICK), (v, k) => snakeCase(k))
      cb(null, feature(adresse.position, properties))
    }),
    stringify()
  )
}

module.exports = {serialize}
