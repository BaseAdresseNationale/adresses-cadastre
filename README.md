# adresses-cadastre

Traitement permettant de produire le fichier des [Adresses extraites du cadastre](https://www.data.gouv.fr/fr/datasets/adresses-extraites-du-cadastre/) utilisé notamment comme source de données pour la Base Adresse Nationale.

## Pré-requis

- Node.js version 14 et supérieures
- Yarn
- Avoir accès aux données MAJIC (convention nécessaire avec l DGFiP)

## Utilisation

### Installation des dépendances

```bash
yarn
```

### Configuration

On recopie ensuite le fichier `.env.sample` en `.env` et on configure les variables d’environnement.

```bash
cp .env.sample .env
```

| Variable d’environnement | Description |
| --- | --- |
| `FANTOIR_PATH` | Chemin vers le [fichier](https://adresse.data.gouv.fr/data/db/fantoir/) `fantoir.sqlite` |
| `MAJIC_PATH` | Chemin vers le fichier `majic.sqlite` |
| `CADASTRE_MILLESIME` | Millésime des [données Cadastre/Etalab](https://cadastre.data.gouv.fr/datasets/cadastre-etalab) à utiliser |
| `LOCALISANTS_MILLESIME` | Millésime des [localisants](https://cadastre.data.gouv.fr/data/ign-localisants/) à utiliser (plus mis à jour) |
| `LOCALISANTS_DEPARTEMENTS` | Liste des départements pour lesquels il y a besoin des localisants |
| `EXPORT_TYPE` | Type d’export à produire (parmi `ndjson`, `bal-csv`, `geojson`, `geojson-public` et `arcep-locaux`) |
| `COMMUNE` | Restriction du fonctionnement du script sur une unique commune |
| `DEPARTEMENTS` | Restriction du fonctionnement du script sur une liste de départements |

### Génération du fichier `localisants.sqlite`

Bien que ce fichier n'évoluant plus, il est utile de pouvoir générer le fichier une première fois.

```bash
yarn prepare-localisants
```

### Production des données

```bash
yarn build
```

Les données résultantes apparaissent dans le dossier `/dist`.
