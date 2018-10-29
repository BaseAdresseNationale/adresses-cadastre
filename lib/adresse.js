const {max, chain, first} = require('lodash')
const {findCodePostal} = require('codes-postaux/full')
const {getNomCommune} = require('./cog')
const {computePositions, getBestPosition} = require('./positions')
const {computeNumeroComplet, computeVoieId} = require('./util/id')

function computeAdresse(locaux, voies, cadastre) {
  const tags = []
  const {id, codeCommune, numero, pseudoNumero, codeVoie, repetition} = first(locaux)

  // Préparations des champs complémentaires utiles aux traitements
  const poidsMax = max(locaux.map(l => l.poids))
  const locauxUtiles = locaux.filter(l => l.poids === poidsMax)
  const categoriesUtiles = chain(locauxUtiles).map('categorie').uniq().value()
  const codesParcelles = chain(locaux).map('codeParcelle').uniq().value()
  if (poidsMax === 0) tags.push('poids-nul')

  // Libellé de voie
  const idVoie = computeVoieId(codeCommune, codeVoie)
  const voie = voies[idVoie]
  tags.push('libelle-' + voie.libelleVoieType)

  // Numéro
  const numeroComplet = computeNumeroComplet(numero || pseudoNumero, repetition)
  if (pseudoNumero) tags.push('pseudo-numero')

  // Acheminement postal
  const candidatCodePostal = findCodePostal(codeCommune, codeVoie, pseudoNumero && numero, repetition)
  if (!candidatCodePostal) tags.push('no-code-postal')

  // Positions
  const positions = computePositions(locauxUtiles, numeroComplet, codesParcelles, cadastre)
  const meilleurePosition = getBestPosition(positions)
  tags.push(meilleurePosition ? `position-${meilleurePosition.type}` : 'position-aucune')

  return {
    id,
    nomCommune: getNomCommune(codeCommune),
    codeVoie,
    codeCommune,

    // Numéro
    numeroComplet,
    numero: numero || pseudoNumero,
    repetition: repetition || null,
    pseudoNumero: Boolean(pseudoNumero),

    // Libellé de voie
    libelleVoie: voie.beautifiedLibelle,
    libelleVoieBrut: voie.libelleVoieRetenu,
    libelleVoieType: voie.libelleVoieType,
    libelleFantoir: voie.libelleFantoir,

    // Acheminement postal
    codePostal: candidatCodePostal && candidatCodePostal.codePostal,
    libelleAcheminement: candidatCodePostal && candidatCodePostal.libelleAcheminement,

    // Positions
    positions,
    meilleurePosition,

    // Compléments
    poidsMax,
    categoriesUtiles,
    codesParcelles,

    // Meta
    tags
  }
}

module.exports = {computeAdresse}
