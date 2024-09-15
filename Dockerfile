# Utilise l'image Arch Linux officielle comme base
FROM archlinux:latest

# Met à jour le système et installe les dépendances de base
RUN pacman -Syu --noconfirm

# Installe Node.js LTS Iron, npm, Puppeteer et les dépendances système requises
RUN pacman -S --noconfirm nodejs-lts-iron npm aria2 nss atk libcups libxss mesa alsa-lib pango cairo gtk3 \
    && pacman -Scc --noconfirm

# Définit le répertoire de travail à l'intérieur du conteneur
WORKDIR /app

# Copie les fichiers package.json et package-lock.json (si présents)
COPY src/package*.json ./src/

# Installe les dépendances Node.js
RUN npm install --prefix ./src

# Copie le reste des fichiers du projet dans le conteneur
COPY . .

# Installe le package .pkg.tar.zst
RUN pacman -U --noconfirm /app/src/megacmd-1.7.0-8-x86_64.pkg.tar.zst

# Définit la commande à exécuter quand le conteneur démarre
CMD ["node", "./src/script.js"]
