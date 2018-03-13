const chalk = require('chalk')
const {forEach, last, chain, sortBy, deburr, countBy} = require('lodash')
const computeJaroWinkler = require('natural').JaroWinklerDistance
const computeLevenshtein = require('natural').LevenshteinDistance

const FIRST_PASS_DEBUG = false
const SECOND_PASS_DEBUG = false
const MIN_SCORE = 0.90

function fantoirResultIsActive(r) {
  return !r.annee_annulation || Number.parseInt(r.annee_annulation, 10) >= 2016
}

function matchFantoir(candidateLabel, fantoir) {
  const deburred = deburr(candidateLabel)
  const accentuationCount = computeLevenshtein(candidateLabel, deburred)
  const normalizedLabel = deburred.toUpperCase().replace(/'/g, ' ').replace(/-/g, ' ')
  const result = chain(fantoir.search(normalizedLabel))
    .filter(fantoirResultIsActive)
    .map(matchResult => {
      matchResult.score = computeJaroWinkler(normalizedLabel, matchResult.libelle_voie_complet) *
        (1 + (0.0001 * accentuationCount))
      return matchResult
    })
    .sortBy(matchResult => -matchResult.score)
    .value()
  if (result.length === 0) return
  return result[0]
}

function reconciliate(rawVoies, fantoir) {
  // On construit pour chaque voie un libellé complet et un libellé inversé
  const firstPassResults = rawVoies
    .filter(rawVoie => {
      const {parts} = rawVoie.extraProperties.labels
      if (parts.length === 0) return false
      const normalized = parts.join(' ').toLowerCase()
      if (normalized.includes('chem') && (normalized.includes('rural') || normalized.includes('communal'))) return false
      return true
    })
    .map(rawVoie => {
      const parts = dedupeParts(rawVoie.extraProperties.labels.parts)

      const regular = parts.join(' ').replace(/\(.*\)/g, '').replace(/\s\s+/g, ' ').trim()
      const reversed = [...parts].reverse().join(' ').replace(/\(.*\)/g, '').replace(/\s\s+/g, ' ').trim()

      const regularResult = matchFantoir(regular, fantoir)
      const reversedResult = matchFantoir(reversed, fantoir)

      const regularBestScore = regularResult ? regularResult.score : 0
      const reversedBestScore = reversedResult ? reversedResult.score : 0

      if (regularBestScore === 0 && reversedBestScore === 0) return {
        label: regular
      }
      if (regularBestScore >= reversedBestScore) return {
        label: regular,
        result: regularResult
      }
      return {
        label: reversed,
        result: reversedResult
      }
    })

  if (FIRST_PASS_DEBUG) {
    firstPassResults.forEach(r => {
      if (!r.result) return console.error(chalk.red(`${r.label} ne matche avec aucune entrée de FANTOIR`))
      const str = `${r.label} => ${r.result.libelle_voie_complet} (${r.result.score})`
      if (r.result.score < MIN_SCORE) return console.error(chalk.yellow(str))
      console.error(chalk.green(str))
    })
  }

  const secondPassResults = chain(firstPassResults)
    .filter(r => r.result)
    .filter(r => r.result.score >= MIN_SCORE)
    .groupBy(r => `${r.result.code_commune}-${r.result.code_rivoli}`)
    .mapValues(matchResults => {
      const bestResult = last(sortBy(matchResults, r => r.result.score))
      return {
        label: bestResult.label,
        score: bestResult.result.score,
        fantoirRecord: bestResult.result
      }
    })
    .value()

  if (SECOND_PASS_DEBUG) {
    console.error()
    forEach(secondPassResults, (result, id) => {
      if (result.score < MIN_SCORE) {
        console.error(`${chalk.red(id)} | ${chalk.white(result.fantoirRecord.libelle_voie_complet)} => ${chalk.white(result.label)} (${result.score})`)
      } else {
        console.error(`${chalk.green(id)} | ${chalk.white(result.fantoirRecord.libelle_voie_complet)} => ${chalk.white(result.label)} (${result.score})`)
      }
    })
  }

  return secondPassResults
}

function dedupeParts(parts) {
  if (parts.length === 0 || parts.length === 1) return parts

  // On calcule la version normalisée de chaque élément
  const np = parts.map(part => deburr(part).toLowerCase())

  // On compte de nombre d'occurence de chaque élément
  const counts = countBy(np)
  const uniqTokens = Object.keys(counts)

  // On test si chaque élément est présent le même nombre de fois, et plus d'une fois
  // Si c'est le cas on ne garde qu'une occurence
  const referenceCount = counts[uniqTokens[0]]
  if (uniqTokens.every(token => counts[token] > 1 && counts[token] === referenceCount)) {
    const deduped = parts.slice(0, uniqTokens.length)
    console.error(`Déduplication de mots : ${parts.join(' ')} => ${deduped.join(' ')}`)
    return deduped
  }

  /* Stratégie alternative */

  let cursor = 1
  let repetitionFrom

  while (!repetitionFrom && cursor <= Math.ceil(np.length / 2)) {
    if (np[0] === np[cursor] &&
      ((cursor + 1 >= np.length) || np[1] === np[cursor + 1]) &&
      ((cursor + 2 >= np.length) || np[2] === np[cursor + 2])) {
      repetitionFrom = cursor
    } else {
      cursor++
    }
  }

  if (repetitionFrom) {
    const deduped = parts.slice(0, repetitionFrom)
    console.error(`Déduplication de mots : ${parts.join(' ')} => ${deduped.join(' ')}`)
    return deduped
  }

  return parts
}

module.exports = {reconciliate, dedupeParts}
