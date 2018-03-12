const {chain, keyBy} = require('lodash')
const expandVoiesFantoir = require('./reconciliation/voies-fantoir')
const reconciliateLabels = require('./reconciliation/voies-pci').reconciliate

function computeVoies(locaux, fantoir, cadastre) {
  const voies = chain(locaux)
    .filter(l => Boolean(l.codeVoie))
    .groupBy(local => `${local.codeCommune}-${local.codeVoie}`)
    .mapValues((locaux, id) => ({
      id,
      codeCommune: locaux[0].codeCommune,
      codeVoie: locaux[0].codeVoie,
      libelleVoie: locaux[0].libelleVoie
    }))
    .map()
    .value()

  const libellesAmeliores = reconciliateLabels(cadastre.rawVoies, fantoir)

  expandVoiesFantoir(voies, fantoir, libellesAmeliores)

  return keyBy(voies, 'id')
}

module.exports = {computeVoies}
