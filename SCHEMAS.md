# Schémas

## CSV

La structure du fichier est compatible avec le [format BAL 1.1](https://cms.geobretagne.fr/sites/default/files/documents/aitf-sig-topo-adresse-fichier-echange-simplifie-v_1.1_0.pdf) spécifié par l'[AITF](http://www.aitf.fr/).\
Le séparateur point-virgule et l'encodage UTF-8 sont utilisés.\
Quelques champs additionnels ont été ajoutés pour que la réutilisation soit plus simple, ou tout simplement parce que l'information est disponible.

Dans __ce fichier__, il y a une ligne par adresse. Néanmoins le format BAL 1.1 autorise plusieurs positions par adresse, et donc plusieurs lignes par adresse.

| Nom du champ | Description | Exemple de valeur | Champ BAL 1.1 |
| --- | --- | --- | --- |
| `cle_interop` | Clé d'interopérabilité (identifiant unique d'adresse) | `27115_0110_00017_bis` | Oui |
| `uid_adresse` | Futur identifiant (vide) | _(vide)_ | Oui |
| `numero` | Numéro de l'adresse | `17` | Oui |
| `suffixe` | Suffixe (bis, ter, a, b, c…)| `bis` | Oui |
| `pseudo_numero` | Indique si le numéro est un numéro fictif créé en attendant d'avoir une adresse réelle | `false` | Non |
| `voie_nom` | Nom de la voie | `Chemin du Voisinet` | Oui |
| `voie_code` | Code de la voie dans le référentiel FANTOIR | `0110` | Non |
| `destination_principale` | Catégorie d'utilisation principale de l'adresse (information indicative) | `habitation` | Non |
| `commune_code` | Code de la commune (INSEE) | `27115` | Non |
| `commune_nom` | Nom de la commune | `Breux-sur-Avre` | Oui |
| `source` | Source principale de l'information | `DGFiP/Etalab` | Oui |
| `long` | Longitude en coordonnées WGS-84 | `1.087303` | Oui |
| `lat` | Latitude en coordonnées WGS-84 | `48.759102` | Oui |
| `x` | Coordonnée `x` dans la [projection légale](https://github.com/etalab/project-legal#projections-l%C3%A9gales-support%C3%A9es) | `559409.42` | Oui |
| `y` | Coordonnée `y` dans la [projection légale](https://github.com/etalab/project-legal#projections-l%C3%A9gales-support%C3%A9es) | `6852702.30` | Oui |
| `position` | Type de position | `entrée` | Oui |
| `date_der_maj` | Date de mise à jour de la ligne (information indicative) | `2018-10-31` | Oui |

## GeoJSON

_À venir._

## NDJSON complet

_À venir._
