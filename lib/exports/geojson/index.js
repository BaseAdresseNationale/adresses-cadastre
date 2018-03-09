const {through, pipeline} = require('mississippi')
const {feature} = require('@turf/turf')
const {pick} = require('lodash')
const {stringify} = require('../../util/geojson-stream')

const PROPERTIES_TO_PICK = [
  'id',
  'numero_complet',
  'pseudo_numero',
  'libelle_voie_retenu',
  'libelle_voie_type',
  'code_commune',
  'position_type',
  'position_error_margin',
  'poids_max',
  'categories_utiles',
  'codes_parcelles'
]

function serialize() {
  return pipeline.obj(
    through.obj((adresse, enc, cb) => {
      if (!adresse.position) return cb()
      const properties = pick(adresse, ...PROPERTIES_TO_PICK)
      cb(null, feature(adresse.position, properties))
    }),
    stringify()
  )
}

module.exports = {serialize}
