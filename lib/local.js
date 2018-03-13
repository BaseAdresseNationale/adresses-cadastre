const LOCAL_TYPE_MAPPING = {
  appartement: 'habitation',
  maison: 'habitation',
  'sol-de-maison': 'habitation',
  'commerce-sans-boutique': 'commerce',
  'commerce-boutique': 'commerce',
  'dependance-commerciale': 'commerce',
  'port-de-plaisance': 'site-touristique',
  'site-industriel': 'site-industriel',
  chantier: 'site-industriel'
}

const LOCAL_TYPE_WEIGHT = {
  habitation: 10,
  commerce: 10,
  'site-industriel': 10,
  'site-touristique': 10,

  divers: 0,
  'dependance-batie-isolee': 0,
  'local-commun': 0,
  gare: 0,
  'installations-techniques': 0
}

function prepareLocal(local, ctx) {
  if (!local.codeVoie) {
    console.error(`Pas de voie spécifiée pour le local ${local.codeCommune}-${local.invariant} => ignoré`)
    return
  }

  const categorieLocal = local.categorieLocal in LOCAL_TYPE_MAPPING ?
    LOCAL_TYPE_MAPPING[local.categorieLocal] :
    local.categorieLocal

  local.categorie = categorieLocal
  local.poids = LOCAL_TYPE_WEIGHT[categorieLocal]

  if (local.numero) {
    const num = Number.parseInt(local.numero, 10)
    if (num >= 5000) {
      local.pseudoNumero = local.numero
      local.numero = undefined
    }
  }

  if (!local.numero && !local.pseudoNumero) {
    local.pseudoNumero = 'X' + (ctx.pseudoNum++).toString().padStart(4, '0')
  }

  local.id = `${local.codeCommune}-${local.codeVoie}-${local.numero || local.pseudoNumero}${local.repetition || ''}`

  return local
}

module.exports = {prepareLocal}
