const {createReadStream, createWriteStream} = require('fs')
const {join} = require('path')
const {pipe} = require('mississippi')
const {parse} = require('@etalab/majic')
const extract = require('./extract')

const exportTypes = {
  geojson: {
    serialize: require('../exports/geojson').serialize,
    getFileName: dep => `adresses-cadastre-${dep}.geojson`,
    computeLocaux: false
  },
  ndjson: {
    serialize: require('ndjson').serialize,
    getFileName: dep => `adresses-cadastre-${dep}.ndjson`,
    computeLocaux: false
  },
  'init-ban': {
    serialize: require('../exports/init-ban').serialize,
    getFileName: dep => `adresses-dgfip-etalab-${dep}.csv`,
    computeLocaux: false
  },
  'geojson-public': {
    serialize: require('../exports/geojson-public').serialize,
    getFileName: dep => `adresses-cadastre-${dep}.geojson`,
    computeLocaux: false
  },
  'bal-csv': {
    serialize: require('../exports/bal-csv').serialize,
    getFileName: dep => `adresses-cadastre-${dep}.csv`,
    computeLocaux: false
  },
  'arcep-locaux': {
    serialize: require('ndjson').serialize,
    getFileName: dep => `adresses-cadastre-${dep}.geojson`,
    computeLocaux: true
  }
}

function extractDepartement({departement, majicPath, fantoirPath, pciPath, destPath, exportType, commune}, cb) {
  const {serialize, getFileName, computeLocaux} = exportTypes[exportType]

  pipe(
    createReadStream(join(majicPath, 'departements', departement, 'BATI.gz')),
    parse({profile: 'simple'}),
    extract({departement, pciPath, fantoirPath, commune, computeLocaux}),
    serialize(),
    createWriteStream(join(destPath, getFileName(departement))),
    cb
  )
}

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
})

module.exports = extractDepartement
