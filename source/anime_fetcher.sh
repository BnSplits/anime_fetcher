#!/usr/bin/bash
clear
# Nettoyer le contenu de links.json et temp_anime_info.json sans les supprimer
echo "[]" > links.json
echo "{}" > info.json

# Introduction
echo "### Anime downloader by BananaSplit v1.0 ###"

# Demander à l'utilisateur quel gestionnaire de paquets il utilise
printf "=> Quel gestionnaire de paquets utilisez-vous ? (apt, dnf, pacman) : "
read package_manager

# Fonction pour installer les paquets avec apt
install_with_apt() {
    sudo apt install -y aria2 nodejs npm jq
    npm install puppeteer readline-sync
}

# Fonction pour installer les paquets avec dnf
install_with_dnf() {
    sudo dnf install -y aria2 nodejs npm jq
    npm install puppeteer readline-sync
}

# Fonction pour installer les paquets avec pacman
install_with_pacman() {
    sudo pacman -S --noconfirm aria2 nodejs npm jq
    npm install puppeteer readline-sync
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
anime_info=$(jq -r '.animeTitle, .animeSeason' info.json)
anime_title=$(echo "$anime_info" | sed -n '1p')
anime_season=$(echo "$anime_info" | sed -n '2p')

# Créer le repertoire de téléchargement
mkdir -p "$HOME/Anime/$anime_title/$anime_season"

# Lire les noms et les liens depuis links.json
links=$(jq -r '.[] | @base64' links.json)

# Télécharger chaque lien en attribuant un nom spécifique au fichier téléchargé
echo "Lancement des téléchargements !"
for item in $links; do
    _jq() {
        echo "${item}" | base64 --decode | jq -r "${1}"
    }
    name=$(_jq '.[0]')
    link=$(_jq '.[1]')
    aria2c -x 16 -d "$HOME/Anime/$anime_title/$anime_season" -o "$name" "$link"
done

# Nettoyer le contenu de links.json et temp_anime_info.json sans les supprimer
echo "[]" > links.json
echo "{}" > info.json

echo "Téléchargements terminés et fichiers temporaires nettoyés."
