const {groupBy} = require('lodash')
const {computeNumeroComplet, computeAdresseId} = require('../util/id')

const MAPPING_CARDINAUX = {
  B: 'bis',
  T: 'ter',
  Q: 'quater'
}

function groupBySuffix(adresse) {
  return `${adresse.code_commune}-${adresse.code_voie}-${adresse.numero}`
}

function rewriteRepetitionAttributes(adresses) {
  if (adresses[0].pseudo_numero) return adresses // On ne fait rien sur les pseudo-numéros
  if (adresses.length === 1 && !adresses[0].repetition) return adresses // Cas trivial
  const group = groupBy(adresses, 'repetition')
  const repetitions = Object.keys(group).filter(x => x !== 'null')
  // Si au moins un des indices de répétition n'est pas dans la liste des adverbes multiplicatifs, on ne fait rien
  if (!repetitions.every(rep => rep in MAPPING_CARDINAUX)) return adresses
  // Sinon on réécrit les indices de répétition et les champs dérivés
  return adresses.map(adresse => {
    if (!adresse.repetition) return adresse
    const rewrittenAdresse = {...adresse}
    const repetition = MAPPING_CARDINAUX[adresse.repetition]
    rewrittenAdresse.id = computeAdresseId(adresse.code_commune, adresse.code_voie, adresse.numero, repetition)
    rewrittenAdresse.repetition = repetition
    rewrittenAdresse.numero_complet = computeNumeroComplet(adresse.numero, repetition)
    return rewrittenAdresse
  })
}

module.exports = {groupBySuffix, rewriteRepetitionAttributes}
