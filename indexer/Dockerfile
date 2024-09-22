FROM node:slim
WORKDIR /indexer
COPY . .
RUN mkdir /source_files
RUN yarn install --production
CMD ["node", "/indexer/index.js"]
EXPOSE 3000