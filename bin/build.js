#!/usr/bin/env node
require('dotenv').config()
const {join} = require('path')
const {promisify} = require('util')
const {ensureDir} = require('fs-extra')
const workerFarm = require('worker-farm')
const departements = require('@etalab/decoupage-administratif/data/departements.json')

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

if (!process.env.CADASTRE_MILLESIME) {
  boom('La variable CADASTRE_MILLESIME doit être fournie pour procéder à l’extraction')
}

if (!process.env.MAJIC_PATH) {
  boom('La variable MAJIC_PATH doit être fournie pour procéder à l’extraction')
}

const millesimeCadastre = process.env.CADASTRE_MILLESIME
const destPath = join(__dirname, '..', 'dist')

const commune = process.env.COMMUNE
const deps = process.env.DEPARTEMENTS ? process.env.DEPARTEMENTS.split(',') : undefined

const exportType = (process.env.EXPORT_TYPE && ['ndjson', 'geojson', 'geojson-public', 'bal-csv', 'arcep-locaux'].includes(process.env.EXPORT_TYPE)) ? process.env.EXPORT_TYPE : 'ndjson'

async function main() {
  await ensureDir(destPath)
  const departementsToExtract = deps || departements.map(d => d.code)
  await Promise.all(departementsToExtract.map(async dep => {
    try {
      await runWorker({
        departement: dep,
        commune,
        millesimeCadastre,
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
