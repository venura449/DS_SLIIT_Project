FROM node:18-alpine

WORKDIR /app

COPY services/notification-service/package*.json ./

RUN npm install

COPY services/notification-service/ .

EXPOSE 3007

CMD ["npm", "start"]
