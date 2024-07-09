#!/usr/bin/bash
#!/bin/bash

# Demander à l'utilisateur quel gestionnaire de paquets il utilise
echo "Quel gestionnaire de paquets utilisez-vous ? (apt, dnf, pacman)"
read package_manager

# Fonction pour installer les paquets avec apt
install_with_apt() {
    sudo apt update
    sudo apt install -y aria2 nodejs npm jq
    sudo npm install -g puppeteer
}

# Fonction pour installer les paquets avec dnf
install_with_dnf() {
    sudo dnf install -y aria2 nodejs npm jq
    sudo npm install -g puppeteer
}

# Fonction pour installer les paquets avec pacman
install_with_pacman() {
    sudo pacman -Syu --noconfirm aria2 nodejs npm jq
    sudo npm install -g puppeteer
}

# Installer les paquets en fonction du gestionnaire de paquets
case $package_manager in
    apt)
        install_with_apt
        ;;
    dnf)
        install_with_dnf
        ;;
    pacman)
        install_with_pacman
        ;;
    *)
        echo "Gestionnaire de paquets non supporté. Veuillez choisir entre apt, dnf, et pacman."
        exit 1
        ;;
esac

echo "Installation terminée."

# Exécuter le fichier script.js avec Node.js
node script.js

# Lire les informations de l'anime depuis le fichier temporaire
anime_info=$(jq -r '.animeTitle, .animeSeason' temp_anime_info.json)
anime_title=$(echo "$anime_info" | sed -n '1p')
anime_season=$(echo "$anime_info" | sed -n '2p')

# Créer les répertoires nécessaires
mkdir -p "$HOME/Anime/$anime_title/$anime_season"

# Télécharger les liens dans $HOME/Anime/$anime_title/$anime_season
links=$(jq -r '.[]' links.json)
for lien in $links; do
    aria2c -x 16 -d "$HOME/Anime/$anime_title/$anime_season" "$lien"
done

# Nettoyer le contenu de links.json et temp_anime_info.json sans les supprimer
echo "[]" > links.json
echo "{}" > temp_anime_info.json

echo "Téléchargements terminés et fichiers temporaires nettoyés."