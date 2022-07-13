const {createWriteStream} = require('fs')
const {join} = require('path')
const bluebird = require('bluebird')
const {chain} = require('lodash')
const {pipeline, finished} = require('mississippi')
const {getCommuneData} = require('@etalab/majic')
const {getCommunesDepartement} = require('../cog')
const extractFromCommune = require('../commune')

const exportTypes = {
  geojson: {
    serialize: require('../exports/geojson').serialize,
    getFileName: dep => `adresses-cadastre-${dep}.geojson`,
    computeLocaux: false
  },
  ndjson: {
    serialize: require('ndjson').stringify,
    getFileName: dep => `adresses-cadastre-${dep}.ndjson`,
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
    serialize: require('ndjson').stringify,
    getFileName: dep => `adresses-locaux-cadastre-${dep}.ndjson`,
    computeLocaux: true
  }
}

async function extractDepartement({departement, millesimeCadastre, destPath, exportType, commune}, cb) {
  const {serialize, getFileName, computeLocaux} = exportTypes[exportType]

  const departementWriter = pipeline.obj(
    serialize(),
    createWriteStream(join(destPath, getFileName(departement)))
  )

  const communes = chain(getCommunesDepartement(departement))
    .map(commune => [commune.code, ...(commune.anciensCodes || [])])
    .flatten()
    .uniq()
    .value()

  await bluebird.map(commune ? [commune] : communes, async commune => {
    console.log(`Traitement de la commune ${commune}…`)
    const locaux = await getCommuneData(commune, {profile: 'simple'})

    if (!locaux) {
      return
    }

    const adressesCommune = await extractFromCommune(locaux, commune, millesimeCadastre, computeLocaux)
    adressesCommune.forEach(a => departementWriter.write(a))
  }, {concurrency: 4})

  departementWriter.end()

  finished(departementWriter, cb)
}

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
})

module.exports = extractDepartement
