FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN node --version
RUN npm --version
RUN npm install -g npm@latest
RUN npm install -g @angular/cli@latest
#RUN npm install ngx-cookie-service --save
COPY . .

RUN npm run build

RUN chmod a+x run.sh

CMD["sh", "-c", "/app/run.sh"]