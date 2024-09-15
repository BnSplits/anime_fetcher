#!/usr/bin/bash

# Définir le répertoire local
ANIMES_DIR="$HOME/Animes"
CONFIG_FILE="./infos.jsonc"  # Spécifie le chemin vers ton fichier infos.json sur l'hôte

# Vérifier si le répertoire local existe
if [ ! -d "$ANIMES_DIR" ]; then
  echo "Le répertoire $ANIMES_DIR n'existe pas. Création du répertoire."
  mkdir -p "$ANIMES_DIR"
  echo "Répertoire $ANIMES_DIR créé avec succès."
else
  echo "Le répertoire $ANIMES_DIR existe déjà."
fi

# Vérifier si le fichier de configuration infos.json existe
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Erreur : Le fichier de configuration $CONFIG_FILE n'existe pas. Veuillez le créer avant de lancer le conteneur."
  exit 1
else
  echo "Le fichier de configuration $CONFIG_FILE a été trouvé."
fi

# Exécution de docker avec montage du fichier de configuration
docker run -it --rm -v "$ANIMES_DIR:/app/src/Animes" -v "$CONFIG_FILE:/app/infos.jsonc" anime-fetcher-docker:latest
