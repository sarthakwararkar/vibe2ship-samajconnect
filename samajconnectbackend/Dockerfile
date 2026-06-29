FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
# Cloud Run automatically sets the PORT environment variable (default: 8080)
EXPOSE 8080
CMD ["npm", "start"]
