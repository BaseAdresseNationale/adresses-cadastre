function formatAdresse({numero, pseudoNumero, repetition, libelleVoie}) {
  return `${numero || pseudoNumero}${repetition || ''} ${libelleVoie}`
}

module.exports = {formatAdresse}
