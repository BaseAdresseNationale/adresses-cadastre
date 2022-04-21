const {minBy} = require('lodash')

const DESTINATIONS = [
  'appartement',
  'installations-techniques',
  'commerce',
  'divers',
  'dependance-commerciale',
  'chantier',
  'dependance-batie-isolee',
  'local-commun',
  'maison',
  'port-de-plaisance',
  'sol-de-maison',
  'site-industriel',
  'gare',
  'station-service',
  'marche',
  'bureaux',
  'depot',
  'parc-de-stationnement',
  'stockage-specifique',
  'atelier-artisanal',
  'atelier-industriel',
  'chenil-vivier',
  'hotel',
  'autre-hebergement',
  'residence-hoteliere',
  'salle-de-spectable',
  'terrain-de-sport',
  'salle-de-loisir',
  'terrain-de-camping',
  'etablissement-detente-bien-etre',
  'centre-de-loisirs',
  'ecole-privee',
  'hopital',
  'centre-medico-social-creche',
  'maison-de-retraite',
  'centre-thermal-reeducation',
  'carriere',
  'autre-etablissement'
]

const DESTINATIONS_IGNOREES = [
  'installations-techniques',
  'dependance-commerciale',
  'chantier',
  'dependance-batie-isolee',
  'local-commun',
  'sol-de-maison',
  'gare',
  'station-service',
  'marche',
  'depot',
  'parc-de-stationnement',
  'stockage-specifique',
  'carriere'
]

const PRECEDENCE_DESTINATIONS = [
  'maison',
  'appartement',
  'commerce',
  'bureaux'
]

function filterLocauxUtiles(locaux) {
  return locaux.filter(local => !DESTINATIONS_IGNOREES.includes(local.destination))
}

function getDestinationPrincipale(destinations) {
  return minBy(destinations, d => {
    const index = PRECEDENCE_DESTINATIONS.indexOf(d)

    if (index >= 0) {
      return index
    }

    return DESTINATIONS_IGNOREES.includes(d) ? 100_000 : 1000
  })
}

function isAdresseUtile(destinationPrincipale) {
  return !DESTINATIONS_IGNOREES.includes(destinationPrincipale)
}

module.exports = {DESTINATIONS, DESTINATIONS_IGNOREES, filterLocauxUtiles, getDestinationPrincipale, isAdresseUtile}
