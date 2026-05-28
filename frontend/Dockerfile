# ==========================================
# Dockerfile - Frontend PWA (Expo Web)
# Multi-stage: Node build → nginx serve
# ==========================================

# ── Stage 1: Build ─────────────────────────
FROM node:20-alpine AS builder

ARG EXPO_PUBLIC_API_URL=/api
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

WORKDIR /app

# Install dependencies (leveraging layer cache)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npx expo export --platform web --output-dir dist

# ── Stage 2: Serve ─────────────────────────
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built PWA from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
