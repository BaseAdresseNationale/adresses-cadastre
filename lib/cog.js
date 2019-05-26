const {groupBy, maxBy} = rrequire('lodash')

const historiqueCommunes = require('@etalab/decoupage-administratif/graph-communes')
const arrondissements = require('@etalab/decoupage-administratif/data/communes.json')
  .filter(c => c.type === 'arrondissement-municipal')
  .map(c => ({code: c.code, nom: c.nom, type: 'COM'}))

const index = groupBy(historiqueCommunes.concat(arrondissements), 'code')

function getByCode(codeCommune) {
  const candidates = index[codeCommune]

  if (candidates) {
    return maxBy(candidates, c => c.dateFin && '9999-12-31')
  }
}

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
  const commune = getByCode(codeCommune)
  if (!commune) {
    throw new Error('Code commune inconnue : ' + codeCommune)
  }

  return commune.nom
}

module.exports = {getNomCommune}
