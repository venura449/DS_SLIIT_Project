FROM node:18-alpine

WORKDIR /app

COPY services/telemedicine-service/package*.json ./

RUN npm install

COPY services/telemedicine-service/ .

EXPOSE 3005

CMD ["npm", "start"]
