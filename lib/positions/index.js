const {chain} = require('lodash')
const {buildParcellePosition} = require('./parcelle')
const {findNumPositions, selectNumVoiePosition} = require('./numero')

function computePosition(locauxUtiles, numeroComplet, codesParcelles, cadastre) {
  const result = {}

  const numVoiePositions = findNumPositions(numeroComplet, codesParcelles, cadastre.parcelles)

  if (numVoiePositions.length > 0) {
    selectNumVoiePosition(result, numVoiePositions)
  } else {
    const codesParcellesUtiles = chain(locauxUtiles)
      .map('codeParcelle')
      .uniq()
      .value()

    buildParcellePosition(
      result,
      codesParcellesUtiles.length > 0 ? codesParcellesUtiles : codesParcelles,
      cadastre.parcelles
    )
  }

  if (!result.position) {
    result.positionType = 'aucune'
  }

  return result
}

module.exports = {computePosition}
