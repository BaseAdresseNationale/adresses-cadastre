function expandOne(voie, fantoir, libellesAmeliores) {
  const {codeCommune, codeVoie, libelleVoie} = voie
  const idVoie = `${codeCommune}-${codeVoie}`
  const voieFantoir = fantoir.get(idVoie)
  if (voieFantoir) {
    voie.fantoir_libelle_voie = voieFantoir.libelle_voie_complet
    if (voieFantoir.annee_annulation) {
      voie.fantoir_annee_annulation = voieFantoir.annee_annulation
      if (Number.parseInt(voieFantoir.annee_annulation, 10) < 2016) {
        console.log(`${codeCommune} | Voie éteinte dans FANTOIR : ${libelleVoie} (${voieFantoir.annee_annulation})`)
      }
    }
    if (idVoie in libellesAmeliores) {
      const libelleAmeliore = libellesAmeliores[idVoie]
      voie.pci_libelle_voie = libelleAmeliore.label
      voie.pci_libelle_matching_score = libelleAmeliore.score
    }
  }
  voie.libelleRetenu = voie.pci_libelle_voie || voie.fantoir_libelle_voie || voie.libelleVoie
}

function expand(voies, fantoir, libellesAmeliores) {
  voies.forEach(voie => expandOne(voie, fantoir, libellesAmeliores))
}

module.exports = expand
