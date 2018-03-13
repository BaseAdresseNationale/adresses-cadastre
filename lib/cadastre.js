const {createReadStream, access} = require('fs')
const {join} = require('path')
const {promisify} = require('util')
const {uniqueId, get} = require('lodash')
const {parse} = require('JSONStream')
const {createGunzip} = require('gunzip-stream')
const getStream = require('get-stream')

const accessAsync = promisify(access)

async function getCommune(basePath, codeCommune) {
  const codeDep = getCodeDepartement(codeCommune)

  const {parcelles, voies, numerosVoie} = await loadPCIComponents(basePath, codeCommune)
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
    get(numeroVoie, 'extraProperties.relatedParcelles', []).forEach(({id, position}) => {
      const parcelleId = codeDep.substr(0, 2) + id
      const parcelleEntry = getParcelleEntry(parcelleId)
      parcelleEntry.numerosVoie.push({
        id: numeroVoieId,
        numero: numeroVoie.properties.TEX,
        geometry: numeroVoie.geometry,
        position
      })
    })
  })
  return {parcelles: parcellesIndex, rawVoies: voies}
}

async function loadPCIComponents(basePath, codeCommune) {
  const codeDep = getCodeDepartement(codeCommune)
  const communePath = join(basePath, codeDep, codeCommune)

  const [parcelles, voies, numerosVoie] = await Promise.all([
    readGeoJSONFile(join(communePath, `cadastre-${codeCommune}-parcelles.json.gz`)),
    readGeoJSONFile(join(communePath, 'raw', `zoncommuni.json.gz`)),
    readGeoJSONFile(join(communePath, 'raw', `numvoie.json.gz`))
  ])
  return {parcelles, voies, numerosVoie}
}

async function readGeoJSONFile(path) {
  if (await fileExists(path)) {
    return getStream.array(
      createReadStream(path)
        .pipe(createGunzip())
        .pipe(parse('features.*'))
    )
  }
  return []
}

async function fileExists(path) {
  try {
    await accessAsync(path)
    return true
  } catch (err) {
    return false
  }
}

function getCodeDepartement(codeCommune) {
  return codeCommune.startsWith('97') ? codeCommune.substr(0, 3) : codeCommune.substr(0, 2)
}

module.exports = {getCommune}
