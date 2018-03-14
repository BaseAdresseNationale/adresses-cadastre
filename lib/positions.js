const {chain, max} = require('lodash')
const {featureCollection, feature, point, distance, centroid} = require('@turf/turf')

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

function selectNumVoiePosition(result, numVoiePositions) {
  const [firstPosition, ...others] = numVoiePositions
  result.position = firstPosition
  result.positionType = 'plaque'
  if (others.length > 0) {
    const distances = others.map(position => distance(firstPosition, position) * 1000)
    const maxDistance = max(distances)
    if (maxDistance >= 5) {
      result.positionErrorMargin = maxDistance
    }
  }
}

function buildParcellePosition(result, codesParcelles, parcellesIndex) {
  const parcelles = chain(codesParcelles)
    .map(codeParcelle => {
      if (!parcellesIndex.has(codeParcelle)) {
        parcelleNotFound(codeParcelle)
        return null
      }
      const parcelleEntry = parcellesIndex.get(codeParcelle)
      if (!parcelleEntry.geometry) {
        parcelleWithoutGeometry(codeParcelle)
        return null
      }
      return parcelleEntry.geometry
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

function computeMaxDistance(ref, ring) {
  return max(ring.map(coords => distance(point(coords), ref) * 1000))
}

function findNumPositions(numeroComplet, codesParcelles, parcelles) {
  return chain(codesParcelles)
    .map(codeParcelle => {
      if (parcelles.has(codeParcelle)) {
        const parcelleRecord = parcelles.get(codeParcelle)
        return parcelleRecord.numerosVoie
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

function parcelleNotFound(id) {
  console.error(`Parcelle ${id} introuvable`)
}

function parcelleWithoutGeometry(id) {
  console.error(`Parcelle ${id} sans géométrie`)
}

module.exports = {computePosition}
