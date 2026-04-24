FROM node:22-alpine

RUN apk add --no-cache docker-cli docker-cli-compose

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY public/ ./public/

EXPOSE 3000
CMD ["node", "server.js"]
