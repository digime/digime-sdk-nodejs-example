FROM node:10.13.0
ENV DOCKERIZED "True"
ARG BUILD_ENV
ENV BUILD_ENV "$BUILD_ENV"
ARG BUILD_TAG
ENV BUILD_TAG "$BUILD_TAG"
ARG NPM_TOKEN

RUN echo "Build tag: $BUILD_TAG"

ENV APPLICATION js-sdk-example

RUN useradd -m -s /bin/nologin ${APPLICATION}
RUN echo 'registry=https://tools.sysdigi.net/npm\n//tools.sysdigi.net/:_authToken=${NPM_TOKEN}' > /home/${APPLICATION}/.npmrc

WORKDIR /${APPLICATION}
COPY . .

RUN chown -R ${APPLICATION}:${APPLICATION} /${APPLICATION}
USER ${APPLICATION}

RUN sh -c 'if [ "${BUILD_ENV}" != "dev" ]; then npm install && npm run build && npm test; fi'

ENV NODE_ENV production
ENV PORT 8081

EXPOSE ${PORT}

CMD ["node", "index.js"]
