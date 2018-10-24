#!/usr/bin/env node
require('dotenv').config()
const {resolve} = require('path')
const {promisify} = require('util')
const mkdirp = promisify(require('mkdirp'))
const workerFarm = require('worker-farm')
const departements = require('@etalab/cog/data/departements.json')

const boom = require('../lib/util/boom')

const workerFarmOptions = {
  maxRetries: 0,
  maxConcurrentCallsPerWorker: 1,
  workerOptions: {
    execArgv: ['--max-old-space-size=2048']
  }
}

const workers = workerFarm(workerFarmOptions, require.resolve('../lib/extract/worker'))
const runWorker = promisify(workers)

if (!process.env.FANTOIR_PATH) {
  boom('La variable FANTOIR_PATH doit être fournie pour procéder à l’extraction')
}
if (!process.env.PCI_PATH) {
  boom('La variable PCI_PATH doit être fournie pour procéder à l’extraction')
}
if (!process.env.MAJIC_PATH) {
  boom('La variable MAJIC_PATH doit être fournie pour procéder à l’extraction')
}
if (!process.env.DEST_PATH) {
  boom('La variable DEST_PATH doit être fournie pour procéder à l’extraction')
}

const fantoirPath = resolve(process.env.FANTOIR_PATH)
const pciPath = resolve(process.env.PCI_PATH)
const majicPath = resolve(process.env.MAJIC_PATH)
const destPath = resolve(process.env.DEST_PATH)

const commune = process.env.COMMUNE
const deps = process.env.DEPARTEMENTS ? process.env.DEPARTEMENTS.split(',') : undefined

const exportType = (process.env.EXPORT_TYPE && ['ndjson', 'init-ban', 'geojson', 'geojson-public'].includes(process.env.EXPORT_TYPE)) ? process.env.EXPORT_TYPE : 'ndjson'

async function main() {
  await mkdirp(destPath)
  const departementsToExtract = deps || departements.map(d => d.code)
  await Promise.all(departementsToExtract.map(async dep => {
    try {
      await runWorker({
        departement: dep,
        commune,
        majicPath,
        fantoirPath,
        pciPath,
        destPath,
        exportType
      })
      console.error(`Extraction du département ${dep} terminée`)
    } catch (error) {
      console.error(`Échec de l'extraction du département ${dep}`)
      console.error(error)
    }
  }))
  workerFarm.end(workers)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
})
