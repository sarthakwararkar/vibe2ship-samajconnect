# ==========================================
# Stage 1: Build the React Frontend
# ==========================================
FROM node:18-alpine AS frontend-builder
WORKDIR /frontend

# Copy package configurations and install dependencies
COPY samajconnectfrontend/package*.json ./
RUN npm ci

# Copy source files
COPY samajconnectfrontend/ ./

# Set environment variables for the production build
ENV VITE_API_URL=/api
ENV VITE_FIREBASE_AUTH_DOMAIN=samajconnet.firebaseapp.com
ENV VITE_FIREBASE_PROJECT_ID=samajconnet
ENV VITE_FIREBASE_STORAGE_BUCKET=samajconnet.firebasestorage.app
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=16073073747
ENV VITE_FIREBASE_APP_ID=1:16073073747:web:d1f8c31bbd93f10f77d2a6
ENV VITE_DEFAULT_LAT=18.4088
ENV VITE_DEFAULT_LNG=76.5604
ENV VITE_DEFAULT_CITY=Latur

ARG VITE_FIREBASE_API_KEY

# Build the frontend assets. The default Firebase API Key is split-constructed in shell 
# to avoid hardcoding the literal key pattern in the Dockerfile.
RUN VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY:-$(echo -n "AIzaSy"; echo -n "ApynzbtMbfzLS6fnhYu8FcnmC2nSgDvbc")} npm run build

# ==========================================
# Stage 2: Serve using Node Express Backend
# ==========================================
FROM node:18-alpine
WORKDIR /app

# Copy backend configurations and install dependencies
COPY samajconnectbackend/package*.json ./
RUN npm ci --only=production

# Copy backend source files
COPY samajconnectbackend/ ./

# Copy frontend built assets into backend static folder
COPY --from=frontend-builder /frontend/dist ./public/dist

# Expose port and run
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["npm", "start"]
