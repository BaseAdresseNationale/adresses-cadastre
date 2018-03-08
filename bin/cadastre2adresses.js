#!/usr/bin/env node
const {resolve} = require('path')
const argv = require('yargs').argv
const {parse} = require('@etalab/majic')
const {stringify} = require('../lib/util/geojson-stream')
const extract = require('../lib/extract')

if (!argv.dep) {
  boom('Le paramètre `--dep` doit être fourni pour procéder à l’extraction')
}
if (!argv.fantoirPath) {
  boom('Le paramètre `--fantoirPath` doit être fourni pour procéder à l’extraction')
}
if (!argv.pciPath) {
  boom('Le paramètre `--pciPath` FANTOIR doit être fourni pour procéder à l’extraction')
}

process.stdin
  .pipe(parse({profile: 'simple'}))
  .pipe(extract({
    departement: argv.dep,
    pciPath: resolve(argv.pciPath),
    fantoirPath: resolve(argv.fantoirPath)
  }))
  .pipe(stringify())
  .pipe(process.stdout)

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
})

function boom(message) {
  console.error(message)
  process.exit(1)
}
