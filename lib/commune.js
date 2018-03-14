const {join} = require('path')
const {chain} = require('lodash')
const {getCommune} = require('./cadastre')
const {computeVoies} = require('./voies')
const {prepareLocal} = require('./local')
const {computeAdresse} = require('./adresse')
const {groupBySuffix, rewriteRepetitionAttributes} = require('./post-processing/rewrite-repetition')

async function extractFromCommune(locaux, codeCommune, fantoir, pciPath) {
  const fantoirCommune = fantoir.commune(codeCommune)
  const cadastre = await getCommune(join(pciPath, 'communes'), codeCommune)
  const voies = computeVoies(locaux, fantoirCommune, cadastre)
  const ctx = {pseudoNum: 1}

  return chain(locaux)
    .map(local => prepareLocal(local, ctx))
    .compact()
    .groupBy('id')
    .map(locauxGroup => computeAdresse(locauxGroup, voies, cadastre))
    // Post-processing des indices de répération
    .groupBy(groupBySuffix)
    .map(rewriteRepetitionAttributes)
    .flatten()
    // Fin du post-processing
    .value()
}

module.exports = extractFromCommune
