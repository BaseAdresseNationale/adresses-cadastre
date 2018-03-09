const test = require('ava')
const {dedupeParts} = require('../lib/reconciliation/voies-pci')

test('déduplication simple', t => {
  t.deepEqual(
    dedupeParts(['Rue', 'des', 'Orchidées', 'Rue', 'des', 'Orchidées']),
    ['Rue', 'des', 'Orchidées']
  )
})

test('pas de déduplication', t => {
  t.deepEqual(
    dedupeParts(['Rue', 'des', 'Orchidées']),
    ['Rue', 'des', 'Orchidées']
  )
})
