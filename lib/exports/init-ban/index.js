/* eslint camelcase: off */
const {through, pipeline} = require('mississippi')
const csvWriter = require('csv-write-stream')

function getPositionType(position, positionType) {
  if (!position) return
  if (positionType === 'plaque') return 'entrance'
  return 'parcel'
}

function convertAdresse(adresse) {
  if (adresse.numero.startsWith('X') || !adresse.codeVoie) return

  return {
    lon: adresse.position ? adresse.position.coordinates[0] : '',
    lat: adresse.position ? adresse.position.coordinates[1] : '',
    positionType: getPositionType(adresse.position, adresse.positionType),
    numero: adresse.repetition ? `${adresse.numero} ${adresse.repetition}` : adresse.numero,
    libelle_voie: adresse.libelleVoieRetenu,
    libelle_voie_type: adresse.libelleVoieType,
    fantoir: adresse.codeCommune + adresse.codeVoie,
    libelle_fantoir: adresse.libelleFantoir,
    code_postal: adresse.codePostal,
    libelle_acheminement: adresse.libelleAcheminement,
    insee_com: adresse.codeCommune,
    destination: adresse.categoriesUtiles.join('|')
  }
}

function serialize() {
  return pipeline.obj(
    through.obj((adresse, enc, cb) => {
      const converted = convertAdresse(adresse)
      if (converted) {
        return cb(null, converted)
      }
      cb()
    }),
    csvWriter()
  )
}

module.exports = {serialize}
