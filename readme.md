```markdown
# Anime Downloader by BananaSplit v1.0

Anime Downloader est un script automatisé pour télécharger des épisodes d'anime en utilisant Puppeteer pour extraire les liens de streaming et Aria2 pour gérer les téléchargements.

## Prérequis

- Linux
- Bash
- Node.js et npm
- Un gestionnaire de paquets (apt, dnf, ou pacman)
```

## Installation et utilisation
```sh
  ./launch.sh
```

### Explications du script

1. Le script commence par nettoyer les fichiers `links.json` et `info.json`.
2. Il demande à l'utilisateur de spécifier le gestionnaire de paquets (apt, dnf, pacman) pour installer les dépendances nécessaires (aria2, nodejs, npm, jq, puppeteer, readline-sync).
3. Ensuite, il exécute le script `script.js` avec Node.js.

### Fonctionnalités du script

- **Recherche d'anime** : Vous pouvez rechercher un anime en entrant son nom.
- **Choix de la saison** : Le script affiche les saisons et films disponibles et vous permet de choisir celui que vous voulez télécharger.
- **Choix des épisodes** : Vous pouvez spécifier les épisodes à télécharger.
- **Téléchargement** : Les liens de téléchargement sont extraits et les épisodes sont téléchargés avec Aria2.

### Détails des fichiers

- `anime_fetcher.sh` : Script principal qui gère l'installation des dépendances et l'exécution du script Node.js.
- `script.js` : Script Node.js qui utilise Puppeteer pour extraire les liens de téléchargement des épisodes.

### Note

Assurez-vous que les fichiers `links.json` et `info.json` sont présents dans le répertoire du projet. Le script les utilisera pour stocker temporairement les informations.

## Contributeurs

- @BnSplits
