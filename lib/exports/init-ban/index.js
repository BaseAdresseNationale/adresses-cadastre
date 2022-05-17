/* eslint camelcase: off */
const {through, pipeline} = require('mississippi')
const csvWriter = require('csv-write-stream')

function getPositionType(positionType) {
  if (positionType === 'entrée') {
    return 'entrance'
  }

  if (positionType === 'parcelle') {
    return 'parcel'
  }

  return ''
}

function convertAdresse(adresse) {
  if (adresse.numero.startsWith('X') || !adresse.codeVoie) {
    return
  }

  return {
    lon: adresse.meilleurePosition ? adresse.meilleurePosition.geometry.coordinates[0] : '',
    lat: adresse.meilleurePosition ? adresse.meilleurePosition.geometry.coordinates[1] : '',
    positionType: adresse.meilleurePosition ? getPositionType(adresse.meilleurePosition.type) : '',
    numero: adresse.repetition ? `${adresse.numero} ${adresse.repetition}` : adresse.numero,
    libelle_voie: adresse.nomVoie,
    libelle_voie_type: adresse.nomVoieType,
    fantoir: adresse.codeCommune + adresse.codeVoie,
    libelle_fantoir: adresse.nomVoieFantoir,
    insee_com: adresse.codeCommune,
    destination: adresse.destinationPrincipale
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
