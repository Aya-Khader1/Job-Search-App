FROM node:24.21.0

WORKDIR /app

COPY package.json .

RUN npm i

COPY . .

CMD ["npm","run","dev"]