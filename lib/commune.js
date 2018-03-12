const {join} = require('path')
const {groupBy, first, chain, max} = require('lodash')
const {featureCollection, feature, point, distance, centroid} = require('@turf/turf')
const {findCodePostal} = require('codes-postaux/full')
const {computeVoies} = require('./voies')

const {getCommune} = require('./cadastre')
const expandLocal = require('./local')

async function extractFromCommune(locaux, codeCommune, fantoirDepartemental, pciPath) {
  const fantoir = fantoirDepartemental.commune(codeCommune)
  const cadastre = await getCommune(join(pciPath, 'communes'), codeCommune)
  const voies = computeVoies(locaux, fantoir, cadastre)

  let pseudoNum = 1

  locaux.forEach(local => {
    expandLocal(local)
    if (!local.numero && !local.pseudoNumero) {
      local.pseudoNumero = 'X' + (pseudoNum++).toString().padStart(4, '0')
    }
    local.id = `${codeCommune}-${local.codeVoie || 'XXXXX'}-${local.numero || local.pseudoNumero}${local.repetition || ''}`
  })

  const byId = groupBy(locaux, 'id')

  return chain(byId).map(locaux => {
    const {id, numero, pseudoNumero, codeVoie, repetition} = first(locaux)

    const poidsMax = max(locaux.map(l => l.poids))
    const locauxUtiles = locaux.filter(l => l.poids === poidsMax)
    const categoriesUtiles = chain(locauxUtiles).map('categorie').uniq().value()
    const numeroComplet = `${numero || pseudoNumero}${repetition || ''}`

    const result = {}

    const codesParcelles = chain(locaux).map('codeParcelle').uniq().value()

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
      result.position_type = 'aucune'
    }

    const idVoie = `${codeCommune}-${codeVoie}`
    const voie = voies[idVoie]

    const candidatCodePostal = findCodePostal(codeCommune, codeVoie, pseudoNumero && numero, repetition)

    const tags = []

    if (pseudoNumero) tags.push('pseudo-numero')
    if (poidsMax === 0) tags.push('poids-nul')
    tags.push('libelle-' + voie.libelle_voie_type)
    if (!codeVoie) tags.push('no-voie')
    tags.push('position-' + result.position_type)
    if (!candidatCodePostal) tags.push('no-code-postal')

    return {
      id,
      numero_complet: numeroComplet || pseudoNumero,
      numero: numero || pseudoNumero,
      repetition: repetition || null,
      pseudo_numero: Boolean(pseudoNumero),
      libelle_voie_retenu: voie.libelle_voie_retenu,
      libelle_voie_type: voie.libelle_voie_type,
      libelle_fantoir: voie.fantoir_libelle_voie,
      code_postal: candidatCodePostal && candidatCodePostal.codePostal,
      libelle_acheminement: candidatCodePostal && candidatCodePostal.libelleAcheminement,
      code_voie: codeVoie,
      code_commune: codeCommune,
      position: result.position,
      position_type: result.position_type,
      position_error_margin: result.position_error_margin,
      poids_max: poidsMax,
      categories_utiles: categoriesUtiles,
      codes_parcelles: codesParcelles,
      tags
    }
  }).compact().value()
}

function selectNumVoiePosition(result, numVoiePositions) {
  const [firstPosition, ...others] = numVoiePositions
  result.position = firstPosition
  result.position_type = 'plaque'
  if (others.length > 0) {
    const distances = others.map(position => distance(firstPosition, position) * 1000)
    const maxDistance = max(distances)
    if (maxDistance >= 5) {
      result.position_error_margin = maxDistance
    }
  }
}

function buildParcellePosition(result, codesParcelles, parcellesIndex) {
  const parcelles = chain(codesParcelles)
    .map(codeParcelle => {
      if (parcellesIndex.has(codeParcelle)) return parcellesIndex.get(codeParcelle).geometry
      return null
    })
    .compact()
    .value()

  if (parcelles.length > 0) {
    result.position = centroid(featureCollection(parcelles.map(p => feature(p)))).geometry
    result.position_type = 'parcelle'
    result.position_error_margin = max(
      parcelles.map(
        parcelle => max(
          parcelle.coordinates[0].map(coords => distance(point(coords), result.position) * 1000)
        )
      )
    )
  }
}

function findNumPositions(numeroComplet, codesParcelles, parcelles) {
  return chain(codesParcelles)
    .map(codeParcelle => {
      if (parcelles.has(codeParcelle)) {
        const parcelleRecord = parcelles.get(codeParcelle)
        return parcelleRecord.numerosVoie
          .filter(numeroVoie => numeroVoie.numero === numeroComplet)
      }
      // Parcelle introuvable
      return []
    })
    .flatten()
    .uniqBy('id')
    .map('geometry')
    .value()
}

module.exports = extractFromCommune
