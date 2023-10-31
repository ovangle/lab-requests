FROM node:18.17

WORKDIR /app

RUN npm i -g @angular/cli

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN ng build

EXPOSE 4200
EXPOSE 80
CMD ["npm", "run", "start"]