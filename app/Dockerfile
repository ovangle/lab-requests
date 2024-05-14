ARG NG_VERSION
FROM node:18.17

RUN npm i -g @angular/cli@>=${NG_VERSION}

USER node
ENV PROJECT_DIR="/home/node/app/"
WORKDIR ${PROJECT_DIR}

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/home/node/.npm,uid=1000 \
    npm ci

COPY --chown=node . .
RUN --mount=type=cache,target=/home/node/.angular/cache,uid=1000 \
    ng build

EXPOSE 3000
CMD ["npm", "run", "start"]
