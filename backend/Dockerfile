FROM node:20

WORKDIR /app

RUN apt-get update && apt-get install -y sqlite3

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

# Crée le dossier pour la DB et donne les permissions
RUN mkdir -p /data && chown node:node /data
VOLUME /data

CMD ["npm", "run", "dev"]