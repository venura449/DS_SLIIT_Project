FROM node:18-alpine

WORKDIR /app

COPY services/doctor-service/package*.json ./

RUN npm install

COPY services/doctor-service/ .

# Create uploads directory for verification documents
RUN mkdir -p /uploads/doctor-verification

EXPOSE 3003

CMD ["npm", "start"]
