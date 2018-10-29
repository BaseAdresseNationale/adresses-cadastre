const {chain, max} = require('lodash')
const {centroid, featureCollection, feature} = require('@turf/turf')
const {parcelleNotFound, parcelleWithoutGeometry, computeMaxDistance} = require('./util')

function buildParcellePosition(result, codesParcelles, planCadastral) {
  const parcelles = chain(codesParcelles)
    .map(codeParcelle => {
      const parcelle = planCadastral.getParcelle(codeParcelle)
      if (!parcelle) {
        parcelleNotFound(codeParcelle)
        return null
      }
      if (!parcelle.geometry) {
        parcelleWithoutGeometry(codeParcelle)
        return null
      }
      return parcelle.geometry
    })
    .compact()
    .value()

  if (parcelles.length > 0) {
    result.position = centroid(featureCollection(parcelles.map(p => feature(p)))).geometry
    result.positionType = 'parcelle'
    result.positionErrorMargin = max(
      parcelles.map(
        parcelle => max(
          parcelle.type === 'MultiPolygon' ?
            max(parcelle.coordinates.map(polygon => computeMaxDistance(result.position, polygon[0]))) :
            computeMaxDistance(result.position, parcelle.coordinates[0])
        )
      )
    )
  }
}

module.exports = {buildParcellePosition}
