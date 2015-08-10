FROM node:0.10-onbuild

ADD . /src

WORKDIR /src

RUN npm install

ENTRYPOINT npm start

ENV PORT 8888
EXPOSE 8888