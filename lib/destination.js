const {minBy} = require('lodash')

const SIMPLIFICATION_DESTINATION_LOCAL = {
  appartement: 'habitation',
  maison: 'habitation',
  'sol-de-maison': 'habitation',
  'commerce-sans-boutique': 'commerce',
  'commerce-boutique': 'commerce',
  'dependance-commerciale': 'dépendance',
  'port-de-plaisance': 'tourisme',
  'site-industriel': 'industrie',
  chantier: 'chantier',
  'dependance-batie-isolee': 'dépendance',
  'installations-techniques': 'équipement',
  gare: 'équipement',
  'local-commun': 'dépendance',
  divers: 'inconnue'
}

const DESTINATIONS_UTILES = [
  'habitation',
  'commerce',
  'industrie',
  'tourisme'
]

const PRECEDENCE_DESTINATIONS = [
  'habitation',
  'commerce',
  'tourisme',
  'industrie',
  'chantier',
  'dépendance',
  'équipement',
  'inconnue'
]

function getDestination(categorieLocal) {
  if (categorieLocal in SIMPLIFICATION_DESTINATION_LOCAL) {
    return SIMPLIFICATION_DESTINATION_LOCAL[categorieLocal]
  }
  console.log('Catégorie de local inconnue : ' + categorieLocal)
  return 'inconnue'
}

function filterLocauxUtiles(locaux) {
  return locaux.filter(local => DESTINATIONS_UTILES.includes(local.destination))
}

function getDestinationPrincipale(destinations) {
  return minBy(destinations, d => PRECEDENCE_DESTINATIONS.indexOf(d))
}

function isAdresseUtile(destinationPrincipale) {
  return DESTINATIONS_UTILES.includes(destinationPrincipale)
}

module.exports = {filterLocauxUtiles, getDestination, getDestinationPrincipale, isAdresseUtile}
