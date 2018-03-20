const STOP_WORDS = [
  'la',
  'le',
  'les',
  'l\'',
  'los',
  'de',
  'des',
  'du',
  'd\'',
  'par',
  'sur',
  'sous',
  'et',
  'au',
  'aux',
  'a',
  'à'
]

const ALWAYS_UPPER = [
  /* Acronymes */
  'za',
  'zac',
  'zi',
  'zad',
  /* Chiffres romains */
  'i',
  'ii',
  'iii',
  'iv',
  'v',
  'vi',
  'vii',
  'viii',
  'ix',
  'x',
  'xi',
  'xii',
  'xiii',
  'xiv',
  'xv',
  'xvi',
  'xvii',
  'xviii',
  'xix',
  'xx',
  'xxi',
  'xxii',
  'xxiii',
  'xxiv',
  'xxv'
]

function capitalize(str) {
  if (str.length === 1) return str.toUpperCase()
  return str[0].toUpperCase() + str.substr(1)
}

function eventuallyCapitalize(word) {
  if (STOP_WORDS.includes(word)) return word
  if (ALWAYS_UPPER.includes(word)) return word.toUpperCase()
  return capitalize(word)
}

function beautify(str) {
  return capitalize(
    str
      .trim()
      .replace(/\bD\s+/g, 'D\'') // Remplace D_ par D'
      .replace(/\bL\s+/g, 'L\'') // Remplace L_ par L'
      .toLowerCase()
      .replace(/\s\s/g, ' ') // Supprime les espaces successifs
      .replace(/'\s*/g, '\' ') // Ajoute un espace après toutes les '
      .split(' ')
      .map(eventuallyCapitalize)
      .join(' ')
      .replace(/'\s/g, '\'')
  )
}

module.exports = {beautify}
