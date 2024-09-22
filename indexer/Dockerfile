FROM node:current-alpine@sha256:c9bb43423a6229aeddf3d16ae6aaa0ff71a0b2951ce18ec8fedb6f5d766cf286
WORKDIR /indexer
COPY . .
RUN mkdir /source_files
RUN yarn install --production
CMD ["node", "/indexer/index.js"]
EXPOSE 3000