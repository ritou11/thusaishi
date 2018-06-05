FROM node:9-alpine

RUN apk --no-cache add yarn

COPY . .

CMD ["yarn", "start"]

EXPOSE 8000
