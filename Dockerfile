FROM node:5.2.0-slim
MAINTAINER kaiyadavenport@gmail.com
COPY ./package.json /app/package.json
WORKDIR /app
RUN npm install --production
ADD ./ /app
ENTRYPOINT ["node", "index.js"]