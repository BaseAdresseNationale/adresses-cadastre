const {chain} = require('lodash')
const {buildParcellePosition} = require('./parcelle')
const {findNumPositions, selectNumVoiePosition} = require('./numero')

function computePosition(locauxUtiles, numeroComplet, codesParcelles, planCadastral) {
  const result = {}

  const numVoiePositions = findNumPositions(numeroComplet, codesParcelles, planCadastral)

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
      planCadastral
    )
  }

  if (!result.position) {
    result.positionType = 'aucune'
  }

  return result
}

module.exports = {computePosition}
