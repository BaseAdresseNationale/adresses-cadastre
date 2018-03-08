const chalk = require('chalk')
const {forEach, last, chain, sortBy, deburr} = require('lodash')

const FIRST_PASS_DEBUG = false
const SECOND_PASS_DEBUG = false

function fantoirResultIsActive(r) {
  return !r.annee_annulation || Number.parseInt(r.annee_annulation, 10) >= 2016
}

function reconciliate(rawVoies, fantoir) {
  // On construit pour chaque voie un libellé complet et un libellé inversé
  const firstPassResults = rawVoies.map(rawVoie => {
    const regular = rawVoie.extraProperties.labels.parts.join(' ')
    const reversed = [...rawVoie.extraProperties.labels.parts].reverse().join(' ')
    const regularResult = fantoir.search(normalize(regular)).filter(fantoirResultIsActive)
    const reversedResult = fantoir.search(normalize(reversed)).filter(fantoirResultIsActive)
    const regularBestScore = regularResult.length > 0 ? regularResult[0].score : 0
    const reversedBestScore = reversedResult.length > 0 ? reversedResult[0].score : 0
    if (regularBestScore === 0 && reversedBestScore === 0) return {
      label: regular,
      reversed: false,
      score: 0
    }
    if (regularBestScore >= reversedBestScore) return {
      label: regular,
      reversed: false,
      score: regularBestScore,
      matchedWith: regularResult[0]
    }
    return {
      label: reversed,
      reversed: true,
      score: reversedBestScore,
      matchedWith: reversedResult[0]
    }
  })

  if (FIRST_PASS_DEBUG) {
    firstPassResults.forEach(r => {
      if (r.score === 0) return console.log(chalk.red(`${r.label} ne matche avec aucune entrée de FANTOIR`))
      const str = `${r.label} => ${r.matchedWith.libelle_voie_complet} (${r.score})${r.reversed ? ' [Inversée]' : ''}`
      if (r.score < 0.8) return console.log(chalk.yellow(str))
      console.log(chalk.green(str))
    })
  }

  const secondPassResults = chain(firstPassResults)
    .filter(r => r.score >= 0.8)
    .groupBy(r => `${r.matchedWith.code_commune}-${r.matchedWith.code_rivoli}`)
    .mapValues(matchResults => {
      const bestResult = last(sortBy(matchResults, 'score'))
      return {
        label: bestResult.label,
        score: bestResult.score,
        fantoirRecord: bestResult.matchedWith
      }
    })
    .value()

  if (SECOND_PASS_DEBUG) {
    forEach(secondPassResults, (result, id) => {
      console.log(`${chalk.green(id)} | ${chalk.white(result.fantoirRecord.libelle_voie_complet)} => ${chalk.white(result.label)} (${result.score})`)
    })
  }

  return secondPassResults
}

function normalize(str) {
  return deburr(str).toUpperCase().replace(/'/g, ' ')
}

module.exports = reconciliate
