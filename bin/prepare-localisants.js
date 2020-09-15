#!/usr/bin/env node
require('dotenv').config()
const {join} = require('path')
const {promisify} = require('util')
const zlib = require('zlib')
const {groupBy} = require('lodash')
const {remove} = require('fs-extra')
const Keyv = require('keyv')
const {getRemoteFeatures} = require('../lib/cadastre')

const gzip = promisify(zlib.gzip)

const dbPath = join(__dirname, '..', 'localisants.sqlite')
const millesimeLocalisants = process.env.LOCALISANTS_MILLESIME
const departements = process.env.LOCALISANTS_DEPARTEMENTS.split(',')

function getDepartementFileUrl(codeDepartement) {
  return `https://cadastre.data.gouv.fr/data/ign-localisants/${millesimeLocalisants}/geojson/localisants-${codeDepartement}.geojson.gz`
}

async function main() {
  await remove(dbPath)
  const db = new Keyv(`sqlite://${dbPath}`)

  for (const codeDepartement of departements) {
    console.log(`Chargement du département ${codeDepartement}`)
    const localisants = await getRemoteFeatures(getDepartementFileUrl(codeDepartement))
    const localisantsCommunes = groupBy(localisants, l => l.properties.IDU.slice(0, 5))

    await Promise.all(Object.keys(localisantsCommunes).map(async codeCommune => {
      const data = await gzip(Buffer.from(JSON.stringify(localisantsCommunes[codeCommune])))
      await db.set(codeCommune, data)
    }))
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
