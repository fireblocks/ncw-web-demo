FROM node:18.17.1-alpine3.17
RUN apk add bash tini && npm i -g typescript
USER node
COPY --chown=node:node package.json /opt/services/ncw-demo/
COPY --chown=node:node yarn.lock /opt/services/ncw-demo/
WORKDIR /opt/services/ncw-demo
RUN yarn set version stable

# TODO:
# RUN yarn --immutable
RUN yarn

COPY  --chown=node:node *.html *.js *.json *.ts /opt/services/ncw-demo/
COPY  --chown=node:node public/ /opt/services/ncw-demo/public/
COPY  --chown=node:node src/ /opt/services/ncw-demo/src/

# TODO:
# yarn build
# ENTRYPOINT ["/sbin/tini",  "-g", "--", "yarn", "start"]
ENTRYPOINT ["/sbin/tini",  "-g", "--", "yarn", "dev", "--host"]
