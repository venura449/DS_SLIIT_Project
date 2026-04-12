FROM node:18-alpine

WORKDIR /app

COPY services/patient-service/package*.json ./

RUN npm install

COPY services/patient-service/ .

EXPOSE 3002

CMD ["npm", "start"]
