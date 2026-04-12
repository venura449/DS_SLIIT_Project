FROM node:18-alpine

WORKDIR /app

COPY services/payment-service/package*.json ./

RUN npm install

COPY services/payment-service/ .

EXPOSE 3006

CMD ["npm", "start"]
