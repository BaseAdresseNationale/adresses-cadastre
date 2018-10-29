/* eslint camelcase: off */
const {through, pipeline} = require('mississippi')
const {feature} = require('@turf/turf')
const {stringify} = require('../../util/geojson-stream')

function convertAdresse(adresse) {
  return {
    id: adresse.id,
    numero: adresse.numeroComplet,
    pseudoNumero: adresse.pseudoNumero,
    nomVoie: adresse.libelleVoie,
    codeVoie: adresse.codeVoie,
    codePostal: adresse.codePostal,
    libelleAcheminement: adresse.libelleAcheminement,
    codeCommune: adresse.codeCommune,
    nomCommune: adresse.nomCommune,
    position: adresse.meilleurePosition.type
  }
}

function serialize() {
  return pipeline.obj(
    through.obj((adresse, enc, cb) => {
      if (!adresse.meilleurePosition || adresse.numero.startsWith('X') || !adresse.codeVoie || adresse.poidsMax === 0) return cb()
      const convertedAdresse = convertAdresse(adresse)
      cb(null, feature(adresse.meilleurePosition.geometry, convertedAdresse, {id: convertedAdresse.id}))
    }),
    stringify()
  )
}

module.exports = {serialize}
