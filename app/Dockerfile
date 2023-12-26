ARG NG_VERSION
FROM node:18.17

RUN npm i -g @angular/cli@>=${NG_VERSION}

USER node
WORKDIR /home/node

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/home/node/.npm,uid=1000 \
    npm ci

COPY . .
RUN --mount=type=cache,target=/home/node/.angular/cache,uid=1000 \
    ng build

EXPOSE 3000
ENTRYPOINT ["npm", "run"]
CMD ["start"]
