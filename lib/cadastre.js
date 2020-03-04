const {uniqueId, get} = require('lodash')
const {parse} = require('JSONStream')
const {createGunzip} = require('gunzip-stream')
const {pipeline} = require('mississippi')
const getStream = require('get-stream')
const got = require('got')
const Keyv = require('keyv')

async function getCommune(codeCommune, millesimeCadastre) {
  const codeDep = getCodeDepartement(codeCommune)

  const {parcelles, voies, routes, numerosVoie} = await loadPCIComponents(codeCommune, millesimeCadastre)
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
  return {
    parcelles: parcellesIndex,
    rawRoutes: routes,
    rawVoies: voies,
    getParcelle(codeParcelle) {
      return parcellesIndex.get(codeParcelle)
    }
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
  return {parcelles, voies, routes, numerosVoie}
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

function getCodeDepartement(codeCommune) {
  return codeCommune.startsWith('97') ? codeCommune.slice(0, 3) : codeCommune.slice(0, 2)
}

module.exports = {getCommune, getRemoteFeatures}
