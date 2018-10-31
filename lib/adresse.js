const {pick, chain, first} = require('lodash')
const {findCodePostal} = require('codes-postaux/full')
const {getNomCommune} = require('./cog')
const {computePositions, getBestPosition} = require('./positions')
const {computeNumeroComplet, computeVoieId} = require('./util/id')
const {filterLocauxUtiles, getDestinationPrincipale, isAdresseUtile} = require('./destination')

function computeAdresse(rawLocaux, voies, cadastre, computeLocaux = false) {
  const tags = []
  const {id, codeCommune, numero, pseudoNumero, codeVoie, repetition} = first(rawLocaux)

  // Préparations des champs complémentaires utiles aux traitements
  const locauxUtiles = filterLocauxUtiles(rawLocaux)
  const destinations = chain(rawLocaux).map('destination').uniq().value()
  const destinationPrincipale = getDestinationPrincipale(destinations)
  const adresseUtile = isAdresseUtile(destinationPrincipale)
  const codesParcelles = chain(rawLocaux).map('codeParcelle').uniq().value()

  if (adresseUtile) {
    tags.push('adresse-utile')
  }

  // Nom de voie
  const idVoie = computeVoieId(codeCommune, codeVoie)
  const {nomVoie, nomVoieOriginal, nomVoieType, nomVoieFantoir} = voies[idVoie]
  tags.push('nom-' + nomVoieType)

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

  const result = {
    id,
    nomCommune: getNomCommune(codeCommune),
    codeVoie,
    codeCommune,

    // Numéro
    numeroComplet,
    numero: numero || pseudoNumero,
    repetition: repetition || null,
    pseudoNumero: Boolean(pseudoNumero),

    // Nom de voie
    nomVoie,
    nomVoieOriginal,
    nomVoieType,
    nomVoieFantoir,

    // Acheminement postal
    codePostal: candidatCodePostal && candidatCodePostal.codePostal,
    libelleAcheminement: candidatCodePostal && candidatCodePostal.libelleAcheminement,

    // Positions
    positions,
    meilleurePosition,

    // Compléments
    destinationPrincipale,
    adresseUtile,
    codesParcelles,

    // Meta
    tags
  }

  // Locaux
  if (computeLocaux) {
    result.locaux = rawLocaux
      .filter(l => l.utile)
      .map(l => {
        const local = pick(l, 'batiment', 'etage', 'entree', 'numero')
        local.type = l.destination
        local.id = `${l.codeParcelle}-${l.batiment}-${l.etage}-${l.entree}-${l.numeroLocal}`
        return local
      })
  }

  return result
}

module.exports = {computeAdresse}
