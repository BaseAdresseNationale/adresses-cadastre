const {join} = require('path')
const {createDatabase} = require('@etalab/fantoir')
const through = require('mississippi').through.obj
const extractFromCommune = require('../commune')

function extract({departement, fantoirPath, pciPath, commune, computeLocaux}) {
  const fantoirPromise = createDatabase(join(fantoirPath, 'departements', departement + '.gz'))

  const knownCommunes = new Set()
  // Context
  let codeCommune
  let locaux

  async function flush(pushable) {
    const fantoir = await fantoirPromise
    const adresses = await extractFromCommune(locaux, codeCommune, fantoir, pciPath, computeLocaux)
    return adresses.forEach(adresse => pushable.push(adresse))
  }

  async function processLocal(local, pushable) {
    if (local.codeCommune !== codeCommune) {
      if (locaux) {
        await flush(pushable)
      }

      // Reset context
      if (knownCommunes.has(local.codeCommune)) {
        throw new Error('Erreur critique : commune déjà vue !')
      }

      knownCommunes.add(local.codeCommune)
      codeCommune = local.codeCommune
      locaux = []
    }

    locaux.push(local)
  }

  return through(
    function (local, enc, cb) {
      if (commune && local.codeCommune !== commune) return cb()
      processLocal(local, this).then(() => cb()).catch(cb)
    },
    function (cb) {
      flush(this).then(() => cb()).catch(cb)
    }
  )
}

module.exports = extract
