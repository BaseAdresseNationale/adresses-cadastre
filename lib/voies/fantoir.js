/* eslint camelcase: off */

function isCanceled(voieFantoir) {
  return voieFantoir.annee_annulation && Number.parseInt(voieFantoir.annee_annulation, 10) < 2016
}

function warnIfCanceled(voieFantoir) {
  if (isCanceled(voieFantoir)) {
    const {code_commune, libelle_voie_complet, annee_annulation} = voieFantoir
    console.error(`${code_commune} | Voie éteinte dans FANTOIR : ${libelle_voie_complet} (${annee_annulation})`)
  }
}

module.exports = {isCanceled, warnIfCanceled}
