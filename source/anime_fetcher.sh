#!/usr/bin/bash
clear
# Nettoyer le contenu de links.json et info.json sans les supprimer
echo "[]" > links.json
echo "{}" > info.json

# Introduction
echo "### Anime downloader by BananaSplit ###"
echo " "
echo "--- Utilisation du site https://anime-sama.fr ---"
echo " "

# Demander à l'utilisateur quel gestionnaire de paquets il utilise
printf "=> Quel gestionnaire de paquets utilisez-vous ? (dnf, pacman, apt) : "
read package_manager

# Fonction pour installer les paquets avec dnf sans les logs d'installation
install_with_dnf() {
    echo "Installation des dépendances..."
    for pkg in aria2 nodejs npm jq; do
        if ! rpm -q $pkg > /dev/null 2>&1; then
            sudo dnf install -y $pkg > /dev/null 2>&1
        fi
    done
    npm list puppeteer readline-sync > /dev/null 2>&1 || npm install puppeteer@latest readline-sync@latest > /dev/null 2>&1
}

# Fonction pour installer les paquets avec pacman sans les logs d'installation
install_with_pacman() {
    echo "Installation des dépendances..."
    for pkg in aria2 nodejs npm jq; do
        if (! pacman -Qi $pkg > /dev/null 2>&1); then
            sudo pacman -S --noconfirm $pkg > /dev/null 2>&1
        fi
    done
    npm list puppeteer readline-sync > /dev/null 2>&1 || npm install puppeteer@latest readline-sync@latest > /dev/null 2>&1
}

# Fonction pour installer les paquets avec apt sans les logs d'installation
install_with_apt() {
    echo "Installation des dépendances..."
    sudo apt-get update -qq
    for pkg in aria2 nodejs npm jq chromium-browser; do
        if (! dpkg -l | grep -q $pkg); then
            sudo apt-get install -y $pkg > /dev/null 2>&1
        fi
    done
    sudo apt-get install -y libx11-xcb1 libxcomposite1 libasound2 libatk1.0-0 libatk-bridge2.0-0 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 > /dev/null 2>&1
    npm list puppeteer readline-sync > /dev/null 2>&1 || npm install puppeteer@latest readline-sync@latest > /dev/null 2>&1
}

# Installer les paquets en fonction du gestionnaire de paquets
case $package_manager in
    dnf)
        install_with_dnf
    ;;
    pacman)
        install_with_pacman
    ;;
    apt)
        install_with_apt
    ;;
    *)
        echo "Gestionnaire de paquets non supporté. Veuillez choisir entre dnf, pacman, et apt."
        exit 1
    ;;
esac

echo "Installation terminée."
echo " "

# Exécuter le fichier script.js avec Node.js
node script.js

# Lire les informations de l'anime depuis le fichier temporaire
anime_info=$(jq -r '.animeTitle, .animeSeason, .lang' info.json)
anime_title=$(echo "$anime_info" | sed -n '1p')
anime_season=$(echo "$anime_info" | sed -n '2p')
lang=$(echo "$anime_info" | sed -n '3p')

# Créer le répertoire de téléchargement
mkdir -p "$HOME/Anime/$anime_title/$anime_season/$lang"

# Lire les noms et les liens depuis links.json
links=$(jq -r '.[] | @base64' links.json)

# Télécharger chaque lien en attribuant un nom spécifique au fichier téléchargé
echo "Lancement des téléchargements !"
echo " "
for item in $links; do
    _jq() {
        echo "${item}" | base64 --decode | jq -r "${1}"
    }
    name=$(_jq '.[0]')
    link=$(_jq '.[1]')
    echo "Téléchargement de $name... "
    aria2c -x 16 -d "$HOME/Anime/$anime_title/$anime_season/$lang" -o "$name.mp4" "$link"  | grep --line-buffered "ETA:"
    echo "Téléchargement terminé!"
    echo " "
done

# Nettoyer le contenu de links.json et info.json sans les supprimer
echo "[]" > links.json
echo "{}" > info.json

echo "Téléchargements terminés et fichiers temporaires nettoyés."
