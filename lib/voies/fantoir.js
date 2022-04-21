const {last} = require('lodash')

function isCanceled(voieFantoir) {
  /* eslint-disable-next-line unicorn/numeric-separators-style */
  return voieFantoir.dateAnnulation && voieFantoir.dateAnnulation < 2016000
}

function warnIfCanceled(voieFantoir) {
  if (isCanceled(voieFantoir)) {
    const {codeCommune, libelle, dateAnnulation} = voieFantoir
    console.error(`${codeCommune} | Voie éteinte dans FANTOIR : ${last(libelle)} (${String(dateAnnulation).slice(0, 4)})`)
  }
}

module.exports = {isCanceled, warnIfCanceled}
