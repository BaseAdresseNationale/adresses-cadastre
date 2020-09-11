const {last, deburr, maxBy, trim} = require('lodash')

const STOP_WORDS = new Set([
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
])

const ALWAYS_UPPER = new Set([
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
])

function capitalize(string) {
  if (string.length === 0) {
    return ''
  }

  if (string.length === 1) {
    return string.toUpperCase()
  }

  return string[0].toUpperCase() + string.slice(1)
}

function eventuallyCapitalize(word) {
  if (STOP_WORDS.has(word)) {
    return word
  }

  if (ALWAYS_UPPER.has(word)) {
    return word.toUpperCase()
  }

  return capitalize(word)
}

function beautify(string) {
  return capitalize(
    trim(string, ' \'-')
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

function trimEndStopWords(string) {
  const words = string.split(' ')
  while (words.length > 0 && STOP_WORDS.has(last(words))) {
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
    if (word.length < 2) {
      return
    }

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

    if (!(nWord in this._words)) {
      return null
    }

    const weightedTypos = this._words[nWord]
    return maxBy(Object.keys(weightedTypos), typo => weightedTypos[typo])
  }
}

function accentuateWordWithCorpus(word, corpus) {
  if (word.toLowerCase() === 'a') {
    return 'à'
  }

  const accentuatedWord = corpus.getWordTypo(word.toLowerCase())
  return accentuatedWord || word
}

function accentuateWithCorpus(string, corpus) {
  return string.split(' ').map(word => accentuateWordWithCorpus(word, corpus)).join(' ')
}

function createCorpus() {
  return new Corpus()
}

module.exports = {accentuateWithCorpus, accentuateWordWithCorpus, createCorpus, Corpus, beautify, trimEndStopWords}
