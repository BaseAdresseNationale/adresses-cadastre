const {resolve, join} = require('path')
const {createWriteStream} = require('fs')
const {through, pipeline} = require('mississippi')
const csvWriter = require('csv-write-stream')
const boom = require('../../util/boom')

async function processAdresse(adresse, files) {
  if (!adresse.position) return
  if (adresse.poids_max === 0) return

  const convertedAdresse = {
    lon: adresse.position.coordinates[0],
    lat: adresse.position.coordinates[1],
    numero: adresse.repetition ? `${adresse.numero} ${adresse.repetition}` : adresse.numero,
    voie_cadastre: adresse.libelle_voie,
    fantoir: adresse.code_commune + adresse.code_voie,
    voie_fantoir: adresse.libelle_fantoir,
    insee_com: adresse.code_commune
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
