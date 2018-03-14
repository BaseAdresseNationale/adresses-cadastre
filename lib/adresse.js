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
  tags.push('libelle-' + voie.libelle_voie_type)
  tags.push('position-' + positionType)
  if (!candidatCodePostal) tags.push('no-code-postal')

  return {
    id,
    numero_complet: numeroComplet || pseudoNumero,
    numero: numero || pseudoNumero,
    repetition: repetition || null,
    pseudo_numero: Boolean(pseudoNumero),
    libelle_voie_retenu: voie.libelle_voie_retenu,
    libelle_voie_type: voie.libelle_voie_type,
    libelle_fantoir: voie.fantoir_libelle_voie,
    code_postal: candidatCodePostal && candidatCodePostal.codePostal,
    libelle_acheminement: candidatCodePostal && candidatCodePostal.libelleAcheminement,
    code_voie: codeVoie,
    code_commune: codeCommune,
    position,
    position_type: positionType,
    position_error_margin: positionErrorMargin,
    poids_max: poidsMax,
    categories_utiles: categoriesUtiles,
    codes_parcelles: codesParcelles,
    tags
  }
}

module.exports = {computeAdresse}
