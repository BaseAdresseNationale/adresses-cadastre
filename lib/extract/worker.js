const {createReadStream, createWriteStream} = require('fs')
const {join} = require('path')
const {finished} = require('mississippi')
const {parse} = require('@etalab/majic')
const extract = require('./extract')

const exportTypes = {
  geojson: {
    serialize: require('../exports/geojson').serialize,
    getFileName: dep => `adresses-cadastre-${dep}.geojson`
  },
  ndjson: {
    serialize: require('ndjson').serialize,
    getFileName: dep => `adresses-cadastre-${dep}.ndjson`
  },
  'init-ban': {
    serialize: require('../exports/init-ban').serialize,
    getFileName: dep => `adresses-dgfip-etalab-${dep}.csv`
  }
}

function extractDepartement({departement, majicPath, fantoirPath, pciPath, destPath, exportType}, cb) {
  const {serialize, getFileName} = exportTypes[exportType]

  finished(
    createReadStream(join(majicPath, 'departements', departement, 'BATI.gz'))
      .pipe(parse({profile: 'simple'}))
      .pipe(extract({departement, pciPath, fantoirPath}))
      .pipe(serialize())
      .pipe(createWriteStream(join(destPath, getFileName(departement)))),
    cb
  )
}

module.exports = extractDepartement
