FROM node:current-alpine3.20
WORKDIR /indexer
COPY ./indexer .
RUN yarn install --production
CMD ["node", "index.js"]
EXPOSE 3000