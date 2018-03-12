const {join} = require('path')
const {chain} = require('lodash')
const {getCommune} = require('./cadastre')
const {computeVoies} = require('./voies')
const {prepareLocal} = require('./local')
const {computeAdresse} = require('./adresse')

async function extractFromCommune(locaux, codeCommune, fantoir, pciPath) {
  const fantoirCommune = fantoir.commune(codeCommune)
  const cadastre = await getCommune(join(pciPath, 'communes'), codeCommune)
  const voies = computeVoies(locaux, fantoirCommune, cadastre)
  const ctx = {pseudoNum: 1}

  return chain(locaux)
    .forEach(local => prepareLocal(local, ctx))
    .groupBy('id')
    .map(locauxGroup => computeAdresse(locauxGroup, voies, cadastre))
    .value()
}

module.exports = extractFromCommune
