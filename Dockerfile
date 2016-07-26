FROM node:5.4.0
MAINTAINER kaiyadavenport@gmail.com
RUN echo 1 > /etc/diggerindocker
RUN mkdir -p /data/db
COPY ./package.json /app/package.json
WORKDIR /app
RUN npm install --production
ADD ./ /app
ENTRYPOINT ["node", "index.js"]