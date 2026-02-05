FROM node:20-alpine

WORKDIR /app

# Instalar dependências de build para bcrypt
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:dev"]