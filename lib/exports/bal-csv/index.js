/* eslint camelcase: off */
const {through, pipeline} = require('mississippi')
const csvWriter = require('csv-write-stream')
const proj = require('@etalab/project-legal')

const today = (new Date()).toISOString().substr(0, 10)

function getCleInterop(codeCommune, codeVoie, numero, suffixe) {
  const parts = [codeCommune, codeVoie, numero.padStart(5, '0')]
  if (suffixe) {
    suffixe.split(' ').forEach(p => parts.push(p))
  }
  return parts.join('_').toLowerCase()
}

function convertAdresse(adresse) {
  if (adresse.numero.startsWith('X') || !adresse.codeVoie || adresse.poidsMax === 0 || adresse.pseudoNumero) return
  const {codeCommune, codeVoie, numero, repetition} = adresse

  const converted = {
    cle_interop: getCleInterop(codeCommune, codeVoie, numero, repetition),
    uid_adresse: '',
    numero,
    suffixe: repetition,
    voie_nom: adresse.libelleVoie,
    voie_code: adresse.codeVoie,
    code_postal: adresse.codePostal,
    libelle_acheminement: adresse.libelleAcheminement,
    commune_code: codeCommune,
    commune_nom: adresse.nomCommune,
    source: 'Etalab/DGFiP',
    long: '',
    lat: '',
    x: '',
    y: '',
    position: '',
    date_der_maj: today
  }

  if (adresse.position) {
    const position = adresse.position.coordinates
    const projectedPosition = proj(position)
    converted.long = position[0]
    converted.lat = position[1]
    converted.x = projectedPosition[0]
    converted.y = projectedPosition[1]
    converted.position = adresse.positionType === 'plaque' ? 'entrée' : 'parcelle'
  }

  return converted
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
    csvWriter({separator: ';'})
  )
}

module.exports = {serialize}
