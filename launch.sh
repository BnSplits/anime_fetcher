#!/usr/bin/bash
# Installation de dépendances npm
echo "Installation de dépendances npm..."
npm list puppeteer inquirer nanospinner gradient-string >/dev/null 2>&1 || npm install puppeteer@latest @inquirer/prompts@latest nanospinner@latest gradient-string@latest >/dev/null 2>&1

# Exécution du script
node ./src/script.js
clear
