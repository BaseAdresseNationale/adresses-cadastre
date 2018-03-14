function expandOne(voie, fantoir, libellesAmeliores) {
  const {codeCommune, codeVoie, libelleVoie} = voie
  const idVoie = `${codeCommune}-${codeVoie}`
  const voieFantoir = fantoir.get(idVoie)
  if (voieFantoir) {
    voie.libelleFantoir = voieFantoir.libelle_voie_complet
    if (voieFantoir.annee_annulation) {
      voie.anneeAnnulationFantoir = voieFantoir.annee_annulation
      if (Number.parseInt(voieFantoir.annee_annulation, 10) < 2016) {
        console.error(`${codeCommune} | Voie éteinte dans FANTOIR : ${libelleVoie} (${voieFantoir.annee_annulation})`)
      }
    }
    if (idVoie in libellesAmeliores) {
      const libelleAmeliore = libellesAmeliores[idVoie]
      voie.pciLibelleVoie = libelleAmeliore.label
      voie.pciLibelleMatchingScore = libelleAmeliore.score
    }
  }
  if (voie.pciLibelleVoie) {
    voie.libelleVoieRetenu = voie.pciLibelleVoie
    voie.libelleVoieType = 'plan-cadastral'
  } else if (voie.libelleFantoir) {
    voie.libelleVoieRetenu = voie.libelleFantoir
    voie.libelleVoieType = 'fantoir'
  } else {
    voie.libelleVoieRetenu = voie.libelleVoie
    voie.libelleVoieType = 'majic'
  }
}

function expand(voies, fantoir, libellesAmeliores) {
  voies.forEach(voie => expandOne(voie, fantoir, libellesAmeliores))
}

module.exports = expand
