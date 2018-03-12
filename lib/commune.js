const {join} = require('path')
const {groupBy} = require('lodash')
const {computeVoies} = require('./voies')
const {computeAdresse} = require('./adresse')

const {getCommune} = require('./cadastre')
const expandLocal = require('./local')

async function extractFromCommune(locaux, codeCommune, fantoirDepartemental, pciPath) {
  const fantoir = fantoirDepartemental.commune(codeCommune)
  const cadastre = await getCommune(join(pciPath, 'communes'), codeCommune)
  const voies = computeVoies(locaux, fantoir, cadastre)

  let pseudoNum = 1

  locaux.forEach(local => {
    expandLocal(local)
    if (!local.numero && !local.pseudoNumero) {
      local.pseudoNumero = 'X' + (pseudoNum++).toString().padStart(4, '0')
    }
    local.id = `${codeCommune}-${local.codeVoie || 'XXXXX'}-${local.numero || local.pseudoNumero}${local.repetition || ''}`
  })

  // On regroupe les locaux par id et on applique l'algorithme pour chaque groupe
  return Object.values(groupBy(locaux, 'id'))
    .map(locaux => computeAdresse(locaux, voies, cadastre))
}

module.exports = extractFromCommune
