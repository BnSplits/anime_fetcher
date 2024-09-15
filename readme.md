# Anime Fetcher

Anime Fetcher est un programme de téléchargement d'animés utilisant Puppeteer pour récupérer les épisodes depuis le site [anime-sama.fr](https://anime-sama.fr) et Mega pour stocker les fichiers.

## Prérequis

Avant de commencer, assurez-vous d'avoir les éléments suivants installés sur votre machine :

- **Docker**
- **Docker Buildx**

## Installation

1. **Cloner le dépôt :**

   ```bash
   git clone https://github.com/BnSplits/anime_fetcher.git
   cd anime_fetcher
   ```

2. **Préparer le fichier de configuration :**

   Avant de construire l'image Docker, vous devez créer un fichier de configuration `infos.jsonc` avec vos informations de connexion MEGA. Placez ce fichier à la racine du projet avec le contenu suivant :

   ```jsonc
   {
     "mail": "ton-adresse@mail.com",
     "psw": "ton-mot-de-passe"
   }
   ```

3. **Construire l'image Docker :**

   Utilisez le script `build-docker.sh` pour construire l'image Docker :

   ```bash
   ./build-docker.sh
   ```

   Ce script utilise Docker Buildx pour créer l'image avec le tag `anime-fetcher-docker:latest`.

## Utilisation

1. **Lancer le conteneur Docker :**

   Avant de lancer le conteneur, assurez-vous que le fichier de configuration `infos.jsonc` est présent. Utilisez le script `launch-docker.sh` pour démarrer le conteneur :

   ```bash
   ./launch-docker.sh
   ```

   Ce script vérifie la présence du répertoire local pour les épisodes (`~/Animes`) et du fichier de configuration. Il montera ces éléments dans le conteneur et exécutera le programme.

2. **Interaction avec le programme :**

   Le programme vous guidera à travers les étapes suivantes :

   - Entrée du nom de l'anime que vous souhaitez télécharger.
   - Sélection de la saison ou du film.
   - Choix entre VF et VOSTFR (si disponible).
   - Sélection des épisodes à télécharger.
   - Choix de conserver les épisodes en local ou uniquement sur Mega.

## Licence

Ce projet est sous licence [MIT](https://opensource.org/licenses/MIT).