const {chain, max} = require('lodash')
const {distance} = require('@turf/turf')
const {parcelleNotFound} = require('./util')

function selectNumVoiePosition(result, numVoiePositions) {
  const [firstPosition, ...others] = numVoiePositions
  result.position = firstPosition
  result.positionType = 'entrée'
  if (others.length > 0) {
    const distances = others.map(position => distance(firstPosition, position) * 1000)
    const maxDistance = max(distances)
    if (maxDistance >= 5) {
      result.positionErrorMargin = maxDistance
    }
  }
}

function findNumPositions(numeroComplet, codesParcelles, planCadastral) {
  return chain(codesParcelles)
    .map(codeParcelle => {
      const parcelle = planCadastral.getParcelle(codeParcelle)
      if (parcelle) {
        return parcelle.numerosVoie
          .filter(numeroVoie => numeroVoie.numero === numeroComplet)
      }
      parcelleNotFound(codeParcelle)
      return []
    })
    .flatten()
    .uniqBy('id')
    .map('geometry')
    .value()
}

module.exports = {selectNumVoiePosition, findNumPositions}
