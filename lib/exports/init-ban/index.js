const {through, pipeline} = require('mississippi')
const csvWriter = require('csv-write-stream')

function getPositionType(position, positionType) {
  if (!position) return
  if (positionType === 'plaque') return 'entrance'
  return 'parcel'
}

function convertAdresse(adresse) {
  if (adresse.numero.startsWith('X') || !adresse.code_voie) return

  return {
    lon: adresse.position ? adresse.position.coordinates[0] : '',
    lat: adresse.position ? adresse.position.coordinates[1] : '',
    position_type: getPositionType(adresse.position, adresse.position_type),
    numero: adresse.repetition ? `${adresse.numero} ${adresse.repetition}` : adresse.numero,
    libelle_voie: adresse.libelle_voie_retenu,
    libelle_voie_type: adresse.libelle_voie_type,
    fantoir: adresse.code_commune + adresse.code_voie,
    libelle_fantoir: adresse.libelle_fantoir,
    code_postal: adresse.code_postal,
    libelle_acheminement: adresse.libelle_acheminement,
    insee_com: adresse.code_commune,
    destination: adresse.categories_utiles.join('|')
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
