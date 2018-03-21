const {max, chain, first} = require('lodash')
const {findCodePostal} = require('codes-postaux/full')
const {computePosition} = require('./positions')
const {computeNumeroComplet, computeVoieId} = require('./util/id')

function computeAdresse(locaux, voies, cadastre) {
  const {id, codeCommune, numero, pseudoNumero, codeVoie, repetition} = first(locaux)

  const poidsMax = max(locaux.map(l => l.poids))
  const locauxUtiles = locaux.filter(l => l.poids === poidsMax)
  const categoriesUtiles = chain(locauxUtiles).map('categorie').uniq().value()
  const numeroComplet = computeNumeroComplet(numero || pseudoNumero, repetition)

  const codesParcelles = chain(locaux).map('codeParcelle').uniq().value()

  const {position, positionType, positionErrorMargin} = computePosition(locauxUtiles, numeroComplet, codesParcelles, cadastre)

  const idVoie = computeVoieId(codeCommune, codeVoie)
  const voie = voies[idVoie]

  const candidatCodePostal = findCodePostal(codeCommune, codeVoie, pseudoNumero && numero, repetition)

  const tags = []

  if (pseudoNumero) tags.push('pseudo-numero')
  if (poidsMax === 0) tags.push('poids-nul')
  tags.push('libelle-' + voie.libelleVoieType)
  tags.push('position-' + positionType)
  if (!candidatCodePostal) tags.push('no-code-postal')

  return {
    id,
    numeroComplet: numeroComplet || pseudoNumero,
    numero: numero || pseudoNumero,
    repetition: repetition || null,
    pseudoNumero: Boolean(pseudoNumero),
    libelleVoie: voie.beautifiedLibelle,
    libelleVoieBrut: voie.libelleVoieRetenu,
    libelleVoieType: voie.libelleVoieType,
    libelleFantoir: voie.libelleFantoir,
    codePostal: candidatCodePostal && candidatCodePostal.codePostal,
    libelleAcheminement: candidatCodePostal && candidatCodePostal.libelleAcheminement,
    nomCommune: candidatCodePostal && candidatCodePostal.nomCommune,
    codeVoie,
    codeCommune,
    position,
    positionType,
    positionErrorMargin,
    poidsMax,
    categoriesUtiles,
    codesParcelles,
    tags
  }
}

module.exports = {computeAdresse}
