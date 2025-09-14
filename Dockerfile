FROM node:16-alpine3.18

WORKDIR /app

EXPOSE 8000

COPY package*.json ./

RUN npm install --production


COPY ./src ./src


CMD ["npm","start"]