FROM node:18-alpine

WORKDIR /app

COPY services/ai-symptom-service/package*.json ./

RUN npm install

COPY services/ai-symptom-service/ .

EXPOSE 3008

CMD ["npm", "start"]
