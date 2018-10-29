const {chain, max} = require('lodash')
const {distance} = require('@turf/turf')
const {parcelleNotFound} = require('./util')

function selectOneNumeroPosition(numerosPositions) {
  const [firstPosition, ...others] = numerosPositions
  if (others.length === 0) {
    return firstPosition
  }
  return {
    ...firstPosition,
    errorMargin: computeMaxDistance(firstPosition.geometry, others.map(o => o.geometry))
  }
}

function computeMaxDistance(referenceGeometry, otherGeometries) {
  const maxDistance = max(
    otherGeometries.map(geometry => distance(referenceGeometry, geometry) * 1000)
  )
  if (maxDistance >= 5) {
    return maxDistance
  }
}

function computeNumerosPositions(numeroComplet, codesParcelles, planCadastral) {
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
    .map(({geometry, id}) => ({codeParcelle: id, geometry, type: 'entrée'}))
    .value()
}

module.exports = {selectOneNumeroPosition, computeNumerosPositions}
