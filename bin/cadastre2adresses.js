#!/usr/bin/env node
const {resolve} = require('path')
const argv = require('yargs').argv
const {parse} = require('@etalab/majic')
const extract = require('../lib/extract')
const boom = require('../lib/util/boom')

if (!argv.dep) {
  boom('Le paramètre `--dep` doit être fourni pour procéder à l’extraction')
}
if (!argv.fantoirPath) {
  boom('Le paramètre `--fantoirPath` doit être fourni pour procéder à l’extraction')
}
if (!argv.pciPath) {
  boom('Le paramètre `--pciPath` FANTOIR doit être fourni pour procéder à l’extraction')
}

const exportTypes = {
  geojson: require('../lib/exports/geojson').serialize,
  ndjson: require('ndjson').serialize,
  'init-ban': require('../lib/exports/init-ban').serialize
}

const serialize = (argv.export && argv.export in exportTypes) ? exportTypes[argv.export] : exportTypes.ndjson

const serializedStream = process.stdin
  .pipe(parse({profile: 'simple'}))
  .pipe(extract({
    departement: argv.dep,
    pciPath: resolve(argv.pciPath),
    fantoirPath: resolve(argv.fantoirPath)
  }))
  .pipe(serialize(argv))

if (argv.out) {
  serializedStream.resume()
} else {
  serializedStream.pipe(process.stdout)
}

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
})
