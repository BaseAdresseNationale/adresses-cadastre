const {createReadStream, createWriteStream} = require('fs')
const {join} = require('path')
const {pipe} = require('mississippi')
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

  pipe(
    createReadStream(join(majicPath, 'departements', departement, 'BATI.gz')),
    parse({profile: 'simple'}),
    extract({departement, pciPath, fantoirPath}),
    serialize(),
    createWriteStream(join(destPath, getFileName(departement))),
    cb
  )
}

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
})

module.exports = extractDepartement
