/* eslint unicorn/numeric-separators-style: off */
const {groupBy} = require('lodash')

const communesActuelles = require('@etalab/decoupage-administratif/data/communes.json')
  .filter(c => ['commune-actuelle', 'arrondissement-municipal'].includes(c.type))

const communesAnciennes = require('@etalab/decoupage-administratif/data/communes.json')
  .filter(c => ['commune-deleguee', 'commune-associee'].includes(c.type))

const communesActuellesIndex = groupBy(communesActuelles, 'code')
const communesAnciennesIndex = groupBy(communesAnciennes, 'code')

const MARSEILLE_MAPPING = {
  13331: '13201',
  13332: '13202',
  13333: '13203',
  13334: '13204',
  13335: '13205',
  13336: '13206',
  13337: '13207',
  13338: '13208',
  13339: '13209',
  13340: '13210',
  13341: '13211',
  13342: '13212',
  13343: '13213',
  13344: '13214',
  13345: '13215',
  13346: '13216'
}

const NOMS_OVERRIDES = {
  '06900': 'Monaco',
  97123: 'Saint-Barthélemy',
  97127: 'Saint-Martin'
}

function normalizeCodeCommune(codeCommune) {
  if (codeCommune in MARSEILLE_MAPPING) {
    return MARSEILLE_MAPPING[codeCommune]
  }

  return codeCommune
}

function getNomCommune(codeCommune) {
  if (codeCommune in NOMS_OVERRIDES) {
    return NOMS_OVERRIDES[codeCommune]
  }

  codeCommune = normalizeCodeCommune(codeCommune)

  const commune = communesAnciennesIndex[codeCommune] || communesActuellesIndex[codeCommune]

  if (!commune) {
    throw new Error('Code commune inconnue : ' + codeCommune)
  }

  return commune.nom
}

function getCodeDepartement(codeCommune) {
  return codeCommune.startsWith('97') ? codeCommune.slice(0, 3) : codeCommune.slice(0, 2)
}

function getCommunesDepartement(codeDepartement) {
  return communesActuelles.filter(c => c.departement === codeDepartement)
}

module.exports = {getNomCommune, getCommunesDepartement, getCodeDepartement}
