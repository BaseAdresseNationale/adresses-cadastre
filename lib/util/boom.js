/* eslint unicorn/no-process-exit: off */

function boom(message) {
  console.error(message)
  process.exit(1)
}

module.exports = boom
