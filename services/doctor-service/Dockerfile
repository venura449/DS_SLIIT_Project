FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create uploads directory for verification documents
RUN mkdir -p /uploads/doctor-verification

EXPOSE 3003

CMD ["npm", "start"]
