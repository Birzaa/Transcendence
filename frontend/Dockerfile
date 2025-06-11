# ==== docker/Dockerfile ====
FROM node:22

# 1) Définir le dossier de travail
WORKDIR /app

# 2) Copier uniquement les fichiers package.json et package-lock.json (si tu en as un)
#    Cela permet de profiter du cache Docker pour 'npm install' tant que package.json n'a pas changé.
COPY package*.json ./

# 3) Installer TOUTES les dépendances (y compris devDependencies, donc typescript, tailwind, etc.)
RUN npm install

# 4) Copier le reste du projet (src/, public/, tailwind.config.js, tsconfig.json, etc.)
COPY . .

RUN npm install -g serve

# 6) Par défaut, exécuter le script 'start' défini dans package.json
#    (qui lance 'npm run build' puis 'serve -s public -l 3000')
CMD ["npm", "run", "start"]
