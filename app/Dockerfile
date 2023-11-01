FROM node:18.17

WORKDIR /srv/app

RUN npm i -g @angular/cli

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN ng build

EXPOSE 3000
CMD ["npm", "run", "serve"]