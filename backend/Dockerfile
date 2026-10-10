# Production Dockerfile for JegaMart Backend (Node.js / Express)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies (utilizing layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose standard application port
EXPOSE 5000

ENV NODE_ENV=production

# Start Node.js Express server
CMD ["node", "server.js"]
