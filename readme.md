# Anime Downloader

**Anime Downloader** est un script automatisé pour télécharger des épisodes d'animés depuis le site [Anime-sama](https://anime-sama.fr) et les stocker localement ou sur un compte Mega.

## Prérequis

Avant d'exécuter le script, assurez-vous que les éléments suivants sont installés sur votre système :

- [Node.js](https://nodejs.org/) (version LTS recommandée)
- [npm](https://www.npmjs.com/)
- [aria2c](https://aria2.github.io/)
- [mega-cmd](https://github.com/meganz/megacmd) (facultatif, pour le stockage sur Mega)

## Installation

1. **Clonez le dépôt**

   Clonez le dépôt GitHub contenant les scripts nécessaires :

   ```bash
   git clone https://github.com/BnSplits/anime_fetcher.git
   ```

2. **Exécutez le script d'installation**

   Rendez le script `launch.sh` exécutable et lancez-le pour installer les dépendances et démarrer le script principal :

   ```bash
   chmod +x launch.sh
   ./launch.sh
   ```

   Le script `launch.sh` effectuera les opérations suivantes :

   - Vérifie et installe les dépendances npm nécessaires.
   - Lance le script principal `script.js`.

## Utilisation

Lorsque vous exécutez `launch.sh`, le script `script.js` vous guidera à travers les étapes suivantes :

1. **Choisissez votre gestionnaire de paquets** :

   - Pacman
   - Apt
   - Dnf

2. **Configuration de Mega (facultatif)** :

   - Voulez-vous utiliser `mega-cmd` pour stocker les épisodes sur un compte Mega ?
   - Si oui, le script vous demandera les informations de connexion (email et mot de passe).

3. **Téléchargez les épisodes** :

   - Entrez le nom de l'animé.
   - Sélectionnez la saison ou le film.
   - Choisissez les épisodes à télécharger (ex. : 1, 5, 8 ou 1-6 ou A pour tous).
   - Le script affichera les liens de téléchargement et procédera au téléchargement des épisodes.

4. **Stockage et nettoyage** :
   - Les épisodes seront téléchargés dans un répertoire local.
   - Si configuré, les épisodes seront également transférés sur Mega et peuvent être supprimés localement après le transfert.

## Configuration de Mega-cmd

Si vous choisissez d'utiliser `mega-cmd`, le script peut créer des répertoires et télécharger les fichiers sur votre compte Mega. Assurez-vous que `mega-cmd` est correctement installé et configuré avant d'exécuter le script.

## Scripts

- **install.sh** : Script d'installation des dépendances et lancement de `launch.sh`.
- **launch.sh** : Installe les dépendances npm et exécute le script principal `script.js`.
- **script.js** : Script principal qui utilise Puppeteer pour automatiser la recherche et le téléchargement des épisodes.

## Notes

- Les erreurs et les logs seront affichés dans la console pour vous aider à diagnostiquer les problèmes.
- Le script est conçu pour fonctionner en mode sans tête (headless) pour Puppeteer.

## Contribuer

- BananaSplit (@BnSplits)
  Les contributions sont les bienvenues ! Si vous avez des suggestions ou des améliorations, n'hésitez pas à ouvrir une [issue](https://github.com/BnSplits/anime_fetcher/issues) ou à soumettre une [pull request](https://github.com/BnSplits/anime_fetcher/pulls).

## License

Ce projet est sous [la licence MIT](LICENSE).
