const {last, deburr, maxBy, trim} = require('lodash')

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
    trim(str, ' \'-')
      .replace(/\bD\s+/g, 'D\'') // Remplace D_ par D'
      .replace(/\bL\s+/g, 'L\'') // Remplace L_ par L'
      .toLowerCase()
      .replace(/\s\s+/g, ' ') // Supprime les espaces successifs
      .replace(/'\s*/g, '\' ') // Ajoute un espace après toutes les '
      .split(' ')
      .filter(s => Boolean(s))
      .map(eventuallyCapitalize)
      .join(' ')
      .replace(/'\s/g, '\'')
  )
}

function trimEndStopWords(str) {
  const words = str.split(' ')
  while (words.length > 0 && STOP_WORDS.includes(last(words))) {
    words.pop()
  }
  return words.join(' ')
}

class Corpus {
  constructor() {
    this._words = {}
  }

  prepareWord(word) {
    const lcWord = word.toLowerCase()
    const nWord = deburr(lcWord)
    return {nWord, lcWord}
  }

  addWord(word) {
    if (word.length < 2) return

    const {nWord, lcWord} = this.prepareWord(word)

    if (!(nWord in this._words)) {
      this._words[nWord] = {[lcWord]: 1}
    }
    if (!(lcWord in this._words[nWord])) {
      this._words[nWord][lcWord] = 1
    }
    this._words[nWord][lcWord]++
  }

  getWordTypo(word) {
    const {nWord} = this.prepareWord(word)

    if (!(nWord in this._words)) return null
    const weightedTypos = this._words[nWord]
    return maxBy(Object.keys(weightedTypos), typo => weightedTypos[typo])
  }
}

function accentuateWordWithCorpus(word, corpus) {
  if (word.toLowerCase() === 'a') return 'à'
  const accentuatedWord = corpus.getWordTypo(word.toLowerCase())
  return accentuatedWord || word
}

function accentuateWithCorpus(str, corpus) {
  return str.split(' ').map(word => accentuateWordWithCorpus(word, corpus)).join(' ')
}

function createCorpus() {
  return new Corpus()
}

module.exports = {accentuateWithCorpus, accentuateWordWithCorpus, createCorpus, Corpus, beautify, trimEndStopWords}
