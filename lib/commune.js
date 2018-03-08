const {join} = require('path')
const {groupBy, first, chain, keyBy, max} = require('lodash')
const {featureCollection, feature, point, distance, centroid} = require('@turf/turf')
const expandVoiesFantoir = require('./reconciliation/voies-fantoir')
const reconciliateLabels = require('./reconciliation/voies-pci')

const {getCommune} = require('./pci')
const expandLocal = require('./local')

async function extractFromCommune(locaux, codeCommune, fantoirDepartemental, pciPath) {
  let pseudoNum = 1
  const fantoir = fantoirDepartemental.commune(codeCommune)
  const cadastre = await getCommune(join(pciPath, 'communes'), codeCommune)

  const libellesAmeliores = reconciliateLabels(cadastre.rawVoies, fantoir)

  locaux.forEach(local => {
    expandLocal(local)
    if (!local.numero && !local.pseudoNumero) {
      local.pseudoNumero = 'X' + (pseudoNum++).toString().padStart(4, '0')
    }
    local.id = `${codeCommune}-${local.codeVoie || 'XXXXX'}-${local.numero || local.pseudoNumero}${local.repetition || ''}`
  })

  const voies = chain(locaux)
    .filter(l => Boolean(l.codeVoie))
    .groupBy(local => `${local.codeCommune}-${local.codeVoie}`)
    .mapValues((locaux, id) => ({
      id,
      codeCommune: locaux[0].codeCommune,
      codeVoie: locaux[0].codeVoie,
      libelleVoie: locaux[0].libelleVoie
    }))
    .map()
    .value()

  expandVoiesFantoir(voies, fantoir, libellesAmeliores)

  const indexedVoies = keyBy(voies, 'id')

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
    const voie = indexedVoies[idVoie]
    const libelleVoieRetenu = voie.libelleRetenu

    return {
      id,
      numero: numeroComplet || pseudoNumero,
      pseudo_numero: Boolean(pseudoNumero),
      libelle_voie: libelleVoieRetenu,
      code_commune: codeCommune,
      position: result.position,
      position_type: result.position_type,
      position_error_margin: result.position_error_margin,
      poids_max: poidsMax,
      categories_utiles: categoriesUtiles,
      codes_parcelles: codesParcelles
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
