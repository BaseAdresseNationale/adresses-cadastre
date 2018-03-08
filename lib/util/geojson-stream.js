const JSONStream = require('JSONStream')

function stringify() {
  return JSONStream.stringify('{"type": "FeatureCollection", "features": [\n', ',\n', ']}\n')
}

module.exports = {stringify}
