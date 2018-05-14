FROM node:9-alpine

RUN npm i npm@latest -g \
 && npm install -g truffle@^4.1.0 \
 && npm install -g ganache-cli

ENTRYPOINT ["truffle"]
CMD ["--help"]
