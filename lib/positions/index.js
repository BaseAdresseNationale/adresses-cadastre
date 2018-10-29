const {chain} = require('lodash')
const {computeParcellePosition} = require('./parcelle')
const {selectOneNumeroPosition, computeNumerosPositions} = require('./numero')

function computePositions(locauxUtiles, numeroComplet, codesParcelles, planCadastral) {
  const positions = []

  const codesParcellesUtiles = chain(locauxUtiles)
    .map('codeParcelle')
    .uniq()
    .value()

  const parcellePosition = computeParcellePosition(
    codesParcellesUtiles.length > 0 ? codesParcellesUtiles : codesParcelles,
    planCadastral
  )

  if (parcellePosition) {
    positions.push(parcellePosition)
  }

  const numerosPositions = computeNumerosPositions(numeroComplet, codesParcelles, planCadastral)

  if (numerosPositions.length === 1) {
    positions.push(numerosPositions[0])
  } else if (numerosPositions.length > 1) {
    positions.push(selectOneNumeroPosition(numerosPositions))
  }

  return positions
}

function getBestPosition(positions) {
  const numeroPosition = positions.find(p => p.type === 'entrée')
  if (numeroPosition) {
    return numeroPosition
  }
  return positions.find(p => p.type === 'parcelle')
}

module.exports = {computePositions, getBestPosition}
