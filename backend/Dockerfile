FROM node:22

WORKDIR /app

RUN apt-get update && apt-get install -y sqlite3

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]