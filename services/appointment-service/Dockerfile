FROM node:18-alpine

WORKDIR /app

COPY services/appointment-service/package*.json ./

RUN npm install

COPY services/appointment-service/ .

EXPOSE 3004

CMD ["npm", "start"]
