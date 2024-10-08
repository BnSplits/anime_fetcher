# Utilise l'image Arch Linux officielle comme base
FROM archlinux:latest

# Met à jour le système et installe les dépendances de base
RUN pacman -Syu --noconfirm

# Installe Node.js LTS Iron, npm, Puppeteer et les dépendances système requises
RUN pacman -S --noconfirm nodejs-lts-iron wget npm aria2 nss atk libcups libxss mesa alsa-lib pango cairo gtk3 \
    && pacman -Scc --noconfirm

# Installe megacmd
RUN wget https://mega.nz/linux/repo/Arch_Extra/x86_64/megacmd-x86_64.pkg.tar.zst && pacman -U --noconfirm "$PWD/megacmd-x86_64.pkg.tar.zst"

# Définit le répertoire de travail à l'intérieur du conteneur
WORKDIR /app

# Copie les fichiers package.json et package-lock.json (si présents)
COPY src/package*.json ./src/

# Installe les dépendances Node.js
RUN npm install --prefix ./src

# Copie le reste des fichiers du projet dans le conteneur
COPY . .

# Définit la commande à exécuter quand le conteneur démarre
CMD ["node", "./src/script.js"]
