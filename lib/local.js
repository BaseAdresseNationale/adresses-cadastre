const {computeAdresseId} = require('./util/id')
const {getDestination, isAdresseUtile} = require('./destination')

function prepareLocal(local, ctx) {
  if (!local.codeVoie) {
    console.error(`Pas de voie spécifiée pour le local ${local.codeCommune}-${local.invariant} => ignoré`)
    return
  }

  local.destination = getDestination(local.categorieLocal)
  local.utile = isAdresseUtile(local.destination)

  if (local.numero) {
    const num = Number.parseInt(local.numero, 10)
    if (num >= 5000) {
      local.pseudoNumero = local.numero
      local.numero = undefined
    }
  }

  if (!local.numero && !local.pseudoNumero) {
    local.pseudoNumero = 'X' + (ctx.pseudoNum++).toString().padStart(4, '0')
  }

  local.id = computeAdresseId(local.codeCommune, local.codeVoie, local.numero || local.pseudoNumero, local.repetition)

  return local
}

module.exports = {prepareLocal}
