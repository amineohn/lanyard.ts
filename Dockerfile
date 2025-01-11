FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY .env .env

COPY . .
RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"]