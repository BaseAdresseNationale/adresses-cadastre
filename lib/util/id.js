
function computeAdresseId(codeCommune, codeVoie, numero, repetition) {
  return `${codeCommune}-${codeVoie}-${numero}${repetition || ''}`
}

function computeVoieId(codeCommune, codeVoie) {
  return `${codeCommune}-${codeVoie}`
}

function computeNumeroComplet(numero, repetition) {
  return `${numero}${repetition || ''}`
}

module.exports = {computeNumeroComplet, computeVoieId, computeAdresseId}
