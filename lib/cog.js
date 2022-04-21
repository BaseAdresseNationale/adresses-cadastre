/* eslint unicorn/numeric-separators-style: off */
const {groupBy, maxBy, uniq, flattenDeep} = require('lodash')

const historiqueCommunes = require('@etalab/decoupage-administratif/graph-communes')

const arrondissementsMunicipaux = require('@etalab/decoupage-administratif/data/communes.json')
  .filter(c => c.type === 'arrondissement-municipal')
  .map(c => ({code: c.code, nom: c.nom, type: 'COM'}))

const collectivitesOutremer = [
  {
    code: '97127',
    nom: 'Saint-Martin',
    type: 'COM'
  },
  {
    code: '97123',
    nom: 'Saint-Barthelemy',
    type: 'COM'
  }
]

const communes = [...historiqueCommunes, ...arrondissementsMunicipaux, ...collectivitesOutremer]

const communesIndex = groupBy(communes, h => `${h.type}${h.code}`)

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
  const commune = getCommune(codeCommune, '9999-99-99')
  if (!commune) {
    throw new Error('Code commune inconnue : ' + codeCommune)
  }

  return commune.nom
}

function getCodeDepartement(codeCommune) {
  return codeCommune.startsWith('97') ? codeCommune.slice(0, 3) : codeCommune.slice(0, 2)
}

function isValidAt(communeEntry, dateValeur) {
  return (!communeEntry.dateDebut || communeEntry.dateDebut <= dateValeur) && (!communeEntry.dateFin || communeEntry.dateFin > dateValeur)
}

function getCodesMembres(commune) {
  return uniq([
    commune.code,
    ...flattenDeep((commune.membres || []).map(getCodesMembres)),
    ...flattenDeep(commune.predecesseur ? getCodesMembres(commune.predecesseur) : [commune.code])
  ])
}

function getCommune(codeCommune, dateValeur, types = ['COM', 'COMD', 'COMA', 'COMP']) {
  if (types.length === 0) {
    throw new Error(`Commune inconnue : ${codeCommune}. Date de valeur : ${dateValeur}`)
  }

  const [type] = types
  const candidates = communesIndex[`${type}${codeCommune}`]

  if (!candidates) {
    return getCommune(codeCommune, dateValeur, types.slice(1))
  }

  const commune = dateValeur
    ? candidates.find(c => isValidAt(c, dateValeur))
    : maxBy(candidates, c => c.dateFin || '9999-99-99')

  if (!commune) {
    // Récupération des communes ayant changé de département
    if (type === 'COM') {
      const plusRecente = maxBy(candidates, 'dateFin')
      if (plusRecente.successeur && plusRecente.successeur.code !== plusRecente.code) {
        return getCommune(plusRecente.successeur.code, dateValeur, ['COM', 'COMD', 'COMA', 'COMP'])
      }
    }

    return getCommune(codeCommune, dateValeur, types.slice(1))
  }

  return commune
}

function getAllCodesCommunes(codeCommune) {
  const commune = getCommune(codeCommune)
  return getCodesMembres(commune)
}

function getCommunesDepartement(codeDepartement) {
  return communes.filter(c => c.type === 'COM' && getCodeDepartement(c.code) === codeDepartement)
}

module.exports = {getNomCommune, getCommunesDepartement, getAllCodesCommunes, getCodeDepartement}
