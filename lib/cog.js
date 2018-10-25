const communes = require('@etalab/cog/data/communes.json')
const {keyBy} = require('lodash')

const communesIndex = keyBy(communes, 'code')

function getCommune(code) {
  return communesIndex[code]
}

module.exports = {getCommune}
