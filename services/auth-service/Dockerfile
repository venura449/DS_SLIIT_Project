FROM node:18-alpine

WORKDIR /app

COPY services/auth-service/package*.json ./

RUN npm install

COPY services/auth-service/ .

EXPOSE 3001

CMD ["npm", "start"]
