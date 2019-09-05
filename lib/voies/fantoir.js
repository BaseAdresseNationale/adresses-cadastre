const {last} = require('lodash')

function isCanceled(voieFantoir) {
  return voieFantoir.dateAnnulation && voieFantoir.dateAnnulation < 2016000
}

function warnIfCanceled(voieFantoir) {
  if (isCanceled(voieFantoir)) {
    const {codeCommune, libelle, dateAnnulation} = voieFantoir
    console.error(`${codeCommune} | Voie éteinte dans FANTOIR : ${last(libelle)} (${String(dateAnnulation).substr(0, 4)})`)
  }
}

module.exports = {isCanceled, warnIfCanceled}
