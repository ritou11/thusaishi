FROM node:9-alpine

RUN apk --no-cache add yarn

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY . .

CMD ["yarn", "start"]

EXPOSE 8000
