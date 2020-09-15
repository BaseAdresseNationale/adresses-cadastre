const {promisify} = require('util')
const zlib = require('zlib')
const {uniqueId, get} = require('lodash')
const {parse} = require('JSONStream')
const {createGunzip} = require('gunzip-stream')
const {pipeline} = require('mississippi')
const getStream = require('get-stream')
const got = require('got')
const Keyv = require('keyv')
const {getCodeDepartement} = require('./cog')

const gunzip = promisify(zlib.gunzip)

const localisantsDb = new Keyv('sqlite://localisants.sqlite')

async function getLocalisants(codeCommune) {
  const data = await localisantsDb.get(codeCommune)

  if (!data) {
    return []
  }

  const decompressedBuffer = await gunzip(data)
  return JSON.parse(decompressedBuffer)
}

async function getCommune(codeCommune, millesimeCadastre) {
  const codeDep = getCodeDepartement(codeCommune)

  const {parcelles, voies, routes, numerosVoie, localisants} = await loadPCIComponents(codeCommune, millesimeCadastre)
  const parcellesIndex = new Map()

  function getParcelleEntry(id) {
    if (!parcellesIndex.has(id)) {
      parcellesIndex.set(id, {numerosVoie: []})
    }

    return parcellesIndex.get(id)
  }

  parcelles.forEach(p => {
    const parcelleEntry = getParcelleEntry(p.properties.id)
    parcelleEntry.geometry = p.geometry
  })
  numerosVoie.forEach(numeroVoie => {
    const numeroVoieId = uniqueId('numvoie_')
    get(numeroVoie, 'extraProperties.relatedParcelles', []).forEach(({id}) => {
      const parcelleId = codeDep.slice(0, 2) + id
      const parcelleEntry = getParcelleEntry(parcelleId)
      parcelleEntry.numerosVoie.push({
        id: numeroVoieId,
        numero: numeroVoie.properties.TEX,
        geometry: numeroVoie.geometry
      })
    })
  })

  const localisantsIndex = new Map()

  localisants.forEach(localisant => {
    localisantsIndex.set(localisant.properties.IDU, localisant)
  })

  return {
    localisants: localisantsIndex,
    vectorise: parcelles.length > 0,
    parcelles: parcellesIndex,
    rawRoutes: routes,
    rawVoies: voies
  }
}

async function loadPCIComponents(codeCommune, millesimeCadastre) {
  const communeUrl = getCommuneUrl(codeCommune, millesimeCadastre)

  const [parcelles, voies, routes, numerosVoie] = await Promise.all([
    getRemoteFeatures(`${communeUrl}/cadastre-${codeCommune}-parcelles.json.gz`),
    getRemoteFeatures(`${communeUrl}/raw/pci-${codeCommune}-zoncommuni.json.gz`),
    getRemoteFeatures(`${communeUrl}/raw/pci-${codeCommune}-tronroute.json.gz`),
    getRemoteFeatures(`${communeUrl}/raw/pci-${codeCommune}-numvoie.json.gz`)
  ])

  if (parcelles.length > 0) {
    return {parcelles, voies, routes, numerosVoie, localisants: []}
  }

  const localisants = await getLocalisants(codeCommune)
  return {parcelles, voies, routes, numerosVoie, localisants}
}

function getCommuneUrl(codeCommune, millesimeCadastre) {
  const codeDep = getCodeDepartement(codeCommune)
  return `https://cadastre.data.gouv.fr/data/etalab-cadastre/${millesimeCadastre}/geojson/communes/${codeDep}/${codeCommune}`
}

const cache = new Keyv('sqlite://cadastre.got-cache.sqlite')

async function getRemoteFeatures(url) {
  try {
    const features = await getStream.array(pipeline.obj(
      got.stream(url, {cache}),
      createGunzip(),
      parse('features.*')
    ))
    return features
  } catch {
    return []
  }
}

module.exports = {getCommune, getRemoteFeatures}
