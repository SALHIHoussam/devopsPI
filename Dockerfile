# Utilise une image officielle Node.js légère
FROM node:16-alpine

# Crée un dossier de travail dans le conteneur
WORKDIR /app

# Copie les fichiers de l'application dans le conteneur
COPY . .

# Installe les dépendances
RUN npm install

# Construit l'application (à adapter selon ton script npm)
RUN npm run dev

# Expose le port sur lequel ton app écoute
EXPOSE 5000

# Commande à exécuter au démarrage du conteneur
CMD ["npm", "start"]
