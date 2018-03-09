const {resolve, join} = require('path')
const {createWriteStream} = require('fs')
const {through, pipeline} = require('mississippi')
const csvWriter = require('csv-write-stream')
const boom = require('../../util/boom')

function getPositionType(position, positionType) {
  if (!position) return
  if (positionType === 'plaque') return 'entrance'
  return 'parcel'
}

async function processAdresse(adresse, files) {
  const convertedAdresse = {
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

  await new Promise(resolve => files.hnFile.write(convertedAdresse, resolve))
}

async function finish(files) {
  return Promise.all([
    new Promise(resolve => files.hnFile.end(resolve)),
    new Promise(resolve => files.gFile.end(resolve))
  ])
}

function serialize(options) {
  if (!options.out) {
    boom('Le paramètre `--out` est requis pour l’export init-BAN')
  }
  const {dep} = options
  const outPath = resolve(options.out)
  const files = {
    hnFile: pipeline.obj(csvWriter(), createWriteStream(join(outPath, `cadastre-housenumbers-${dep}.csv`))),
    gFile: pipeline.obj(csvWriter(), createWriteStream(join(outPath, `cadastre-groups-${dep}.csv`)))
  }

  return through.obj(
    (adresse, enc, cb) => {
      processAdresse(adresse, files).then(() => cb()).catch(cb)
    },
    cb => {
      finish(files).then(() => cb()).catch(cb)
    }
  )
}

module.exports = {serialize}
