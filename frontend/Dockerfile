FROM mhart/alpine-node:latest

ENV PORT 3000

RUN mkdir -p /usr/src/frontend
WORKDIR /usr/src/frontend

COPY package*.json yarn.lock ./

RUN yarn global add pm2
RUN yarn

COPY . .

ENV NODE_ENV=production

RUN yarn --production=true build

EXPOSE 3000

CMD [ "pm2-runtime", "npm", "--", "start" ]
