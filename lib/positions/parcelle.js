const {chain, max} = require('lodash')
const {centroid, featureCollection, feature} = require('@turf/turf')
const {parcelleNotFound, parcelleWithoutGeometry, computeMaxDistance} = require('./util')

function computeParcellePosition(codesParcelles, planCadastral) {
  const parcelles = chain(codesParcelles)
    .map(codeParcelle => {
      const parcelle = planCadastral.parcelles.get(codeParcelle)
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
    const {geometry} = centroid(featureCollection(parcelles.map(p => feature(p))))
    const type = 'parcelle'
    const errorMargin = max(
      parcelles.map(
        parcelle => max(
          parcelle.type === 'MultiPolygon'
            ? max(parcelle.coordinates.map(polygon => computeMaxDistance(geometry, polygon[0])))
            : computeMaxDistance(geometry, parcelle.coordinates[0])
        )
      )
    )
    return {type, geometry, errorMargin}
  }

  if (!planCadastral.vectorise) {
    const localisants = chain(codesParcelles)
      .map(codeParcelle => {
        const localisant = planCadastral.localisants.get(codeParcelle)
        if (!localisant || !localisant.geometry) {
          return null
        }

        return localisant.geometry
      })
      .compact()
      .value()

    if (localisants.length > 0) {
      return {type: 'parcelle', geometry: localisants[0]}
    }
  }
}

module.exports = {computeParcellePosition}
