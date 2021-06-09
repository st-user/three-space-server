FROM node:15-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY . ./

CMD [ "node", "production-server.js" ]


