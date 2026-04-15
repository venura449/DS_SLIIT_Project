# Multi-stage build for React frontend
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build time arguments - use relative path so Nginx can proxy
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy package.json and package-lock.json (if exists)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy the entire project
COPY . .

# Build the Vite app with environment variable
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy nginx config (optional, uses default if not provided)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
