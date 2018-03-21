#!/usr/bin/env node
const {resolve} = require('path')
const {promisify} = require('util')
const yargs = require('yargs')
const mkdirp = promisify(require('mkdirp'))
const workerFarm = require('worker-farm')
const boom = require('../lib/util/boom')
const departements = require('../departements.json')

const workers = workerFarm({maxRetries: 0, maxConcurrentCallsPerWorker: 1}, require.resolve('../lib/extract/worker'))
const runWorker = promisify(workers)

const argv = yargs
  .coerce(['fantoirPath', 'pciPath', 'majicPath', 'destPath'], resolve)
  .coerce('dep', x => x.split(','))
  .coerce('commune', String)
  .argv

if (!argv.fantoirPath) {
  boom('Le paramètre `--fantoirPath` doit être fourni pour procéder à l’extraction')
}
if (!argv.pciPath) {
  boom('Le paramètre `--pciPath` doit être fourni pour procéder à l’extraction')
}
if (!argv.majicPath) {
  boom('Le paramètre `--majicPath` doit être fourni pour procéder à l’extraction')
}
if (!argv.destPath) {
  boom('Le paramètre `--destPath` doit être fourni pour procéder à l’extraction')
}

const exportType = (argv.export && ['ndjson', 'init-ban', 'geojson', 'geojson-public'].includes(argv.export)) ? argv.export : 'ndjson'

async function main() {
  await mkdirp(argv.destPath)
  const departementsToExtract = argv.dep || departements.map(d => d.code)
  await Promise.all(departementsToExtract.map(async dep => {
    try {
      await runWorker({
        departement: dep,
        commune: argv.commune,
        majicPath: argv.majicPath,
        fantoirPath: argv.fantoirPath,
        pciPath: argv.pciPath,
        destPath: argv.destPath,
        exportType
      })
      console.error(`Extraction du département ${dep} terminée`)
    } catch (err) {
      console.error(`Échec de l'extraction du département ${dep}`)
      console.error(err)
    }
  }))
  workerFarm.end(workers)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
})
