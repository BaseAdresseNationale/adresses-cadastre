const {chain} = require('lodash')
const {createFantoirCommune} = require('@etalab/fantoir')
const {getCommune} = require('./cadastre')
const {computeVoies} = require('./voies')
const {prepareLocal} = require('./local')
const {computeAdresse} = require('./adresse')
const {groupBySuffix, rewriteRepetitionAttributes} = require('./post-processing/rewrite-repetition')

async function extractFromCommune(locaux, codeCommune, millesimeCadastre, computeLocaux = false) {
  const fantoir = await createFantoirCommune(codeCommune, {withAnciennesCommunes: false})
  const cadastre = await getCommune(codeCommune, millesimeCadastre)
  const voies = computeVoies(locaux, fantoir, cadastre)
  const ctx = {pseudoNum: 1}

  return chain(locaux)
    .map(local => prepareLocal(local, ctx))
    .compact()
    .groupBy('id')
    .map(locauxGroup => computeAdresse(locauxGroup, voies, cadastre, computeLocaux))
    // Post-processing des indices de répération
    .groupBy(groupBySuffix)
    .map(rewriteRepetitionAttributes)
    .flatten()
    // Fin du post-processing
    .value()
}

module.exports = extractFromCommune
