FROM node:20.5

WORKDIR /app

RUN npm i -g @angular/cli

COPY package.json package-lock.json .
RUN npm ci

COPY . .

EXPOSE '4200'
CMD ["npm run start"]