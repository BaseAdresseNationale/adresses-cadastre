const {chain, keyBy} = require('lodash')
const {extractWords, reconciliate} = require('./cadastre')
const {warnIfCanceled} = require('./fantoir')
const {beautify, createCorpus, accentuateWithCorpus} = require('./util')

function computeVoies(locaux, fantoir, cadastre) {
  const voies = chain(locaux)
    .filter(l => Boolean(l.codeVoie))
    .groupBy(local => `${local.codeCommune}-${local.codeVoie}`)
    .mapValues((locaux, id) => ({
      id,
      codeCommune: locaux[0].codeCommune,
      codeVoie: locaux[0].codeVoie,
      libelleMajic: locaux[0].libelleVoie
    }))
    .map()
    .value()

  const libellesAmeliores = reconciliate(cadastre.rawVoies, fantoir)
  const corpus = createCorpus()

  extractWords(cadastre.rawRoutes, corpus)
  extractWords(cadastre.rawVoies, corpus)

  voies.forEach(voie => {
    /* PCI */

    if (voie.id in libellesAmeliores) {
      const libelleAmeliore = libellesAmeliores[voie.id]
      voie.pciLibelleVoie = libelleAmeliore.label
      voie.pciLibelleMatchingScore = libelleAmeliore.score
    }

    /* FANTOIR */

    const voieFantoir = fantoir.get(voie.id)

    if (voieFantoir) {
      voie.libelleFantoir = voieFantoir.libelle_voie_complet
      voie.libelleFantoirAccentue = accentuateWithCorpus(voieFantoir.libelle_voie_complet, corpus)
      warnIfCanceled(voieFantoir)
    }

    /* Finalisation */

    if (voie.pciLibelleVoie) {
      voie.libelleVoieRetenu = voie.pciLibelleVoie
      voie.libelleVoieType = 'plan-cadastral'
    } else if (voie.libelleFantoir) {
      voie.libelleVoieRetenu = voie.libelleFantoirAccentue
      voie.libelleVoieType = 'fantoir'
    } else {
      voie.libelleVoieRetenu = voie.libelleMajic
      voie.libelleVoieType = 'majic'
    }

    voie.beautifiedLibelle = beautify(voie.libelleVoieRetenu)
  })

  return keyBy(voies, 'id')
}

module.exports = {computeVoies}
