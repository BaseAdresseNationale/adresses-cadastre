const through = require('mississippi').through.obj
const extractFromCommune = require('../commune')

function extract({millesimeCadastre, commune, computeLocaux}) {
  const knownCommunes = new Set()
  // Context
  let codeCommune
  let locaux

  async function flush(pushable) {
    const adresses = await extractFromCommune(locaux, codeCommune, millesimeCadastre, computeLocaux)
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
    async function (local, enc, cb) {
      if (commune && local.codeCommune !== commune) {
        return cb()
      }

      try {
        await processLocal(local, this)
        cb()
      } catch (error) {
        cb(error)
      }
    },
    async function (cb) {
      try {
        await flush(this)
        cb()
      } catch (error) {
        cb(error)
      }
    }
  )
}

module.exports = extract
