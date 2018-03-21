/* eslint camelcase: off */
const {through, pipeline} = require('mississippi')
const {feature} = require('@turf/turf')
const {stringify} = require('../../util/geojson-stream')

function convertAdresse(adresse) {
  return {
    id: adresse.id,
    numero: adresse.numeroComplet,
    libelle_voie: adresse.libelleVoie,
    code_postal: adresse.codePostal,
    libelle_acheminement: adresse.libelleAcheminement,
    code_commune: adresse.codeCommune,
    nom_commune: adresse.nomCommune,
    position: adresse.position_type,
    destination: adresse.categoriesUtiles,
    parcelles: adresse.codesParcelles
  }
}

function serialize() {
  return pipeline.obj(
    through.obj((adresse, enc, cb) => {
      if (!adresse.position || adresse.pseudoNumero || adresse.poidsMax === 0) return cb()
      cb(null, feature(adresse.position, convertAdresse(adresse)))
    }),
    stringify()
  )
}

module.exports = {serialize}
