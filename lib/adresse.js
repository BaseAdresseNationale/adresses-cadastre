const {max, chain, first} = require('lodash')
const {findCodePostal} = require('codes-postaux/full')
const {getNomCommune} = require('./cog')
const {computePositions, getBestPosition} = require('./positions')
const {computeNumeroComplet, computeVoieId} = require('./util/id')

function computeAdresse(locaux, voies, cadastre) {
  const {id, codeCommune, numero, pseudoNumero, codeVoie, repetition} = first(locaux)

  const poidsMax = max(locaux.map(l => l.poids))
  const locauxUtiles = locaux.filter(l => l.poids === poidsMax)
  const categoriesUtiles = chain(locauxUtiles).map('categorie').uniq().value()
  const numeroComplet = computeNumeroComplet(numero || pseudoNumero, repetition)

  const codesParcelles = chain(locaux).map('codeParcelle').uniq().value()

  const idVoie = computeVoieId(codeCommune, codeVoie)
  const voie = voies[idVoie]

  const candidatCodePostal = findCodePostal(codeCommune, codeVoie, pseudoNumero && numero, repetition)

  const tags = []

  if (pseudoNumero) tags.push('pseudo-numero')
  if (poidsMax === 0) tags.push('poids-nul')
  tags.push('libelle-' + voie.libelleVoieType)
  if (!candidatCodePostal) tags.push('no-code-postal')

  /* Positions */

  const positions = computePositions(locauxUtiles, numeroComplet, codesParcelles, cadastre)
  const meilleurePosition = getBestPosition(positions)
  tags.push(meilleurePosition ? `position-${meilleurePosition.type}` : 'position-aucune')

  /* Final return */

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
    nomCommune: getNomCommune(codeCommune),
    codeVoie,
    codeCommune,

    /* Positions */
    positions,
    meilleurePosition,

    poidsMax,
    categoriesUtiles,
    codesParcelles,

    /* Meta */
    tags
  }
}

module.exports = {computeAdresse}
